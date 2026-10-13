import { Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";

import { ApiError } from "../../common/api-error";
import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { generateTemporaryPassword } from "../../common/temporary-password";
import { recordAudit } from "../audit/audit";
import { PasswordService } from "../auth/password.service";
import { MAILER, type Mailer } from "../mail/mailer";
import { canAssignRole } from "../roles/role-policy";
import { Role, type RoleCode } from "../roles/role.entity";
import { applyTemporaryPassword, deliverTemporaryPassword } from "../users/temporary-credentials";
import { User } from "../users/user.entity";
import type {
  ApproveMembershipRequestDto,
  ListMembershipRequestsQuery,
  RejectMembershipRequestDto,
} from "./dto/membership.dto";
import { MembershipRequest } from "./membership-request.entity";

function roleCodes(user: User) {
  return (user.roles ?? []).map((role) => role.code);
}

function toView(request: MembershipRequest, reviewer?: User | null) {
  return {
    id: request.id,
    status: request.status,
    message: request.message,
    createdAt: request.createdAt,
    user: {
      id: request.user.id,
      fullName: request.user.fullName,
      email: request.user.emailNormalized,
      emailVerified: request.user.emailVerifiedAt !== null,
    },
    approvedRole: request.approvedRole?.code ?? null,
    reviewedAt: request.reviewedAt,
    reviewedBy: reviewer ? { id: reviewer.id, fullName: reviewer.fullName } : null,
    reviewComment: request.reviewComment,
  };
}

@Injectable()
export class MembershipRequestsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(PasswordService)
    private readonly passwords: PasswordService,
    @Inject(MAILER)
    private readonly mailer: Mailer,
    @Inject(SECURITY_CONFIG)
    private readonly config: SecurityConfig,
  ) {}

  async list(query: ListMembershipRequestsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const builder = this.dataSource
      .getRepository(MembershipRequest)
      .createQueryBuilder("request")
      .innerJoinAndSelect("request.user", "user")
      .leftJoinAndSelect("request.approvedRole", "approvedRole")
      .where("request.status = :status", { status: query.status ?? "pending" })
      .orderBy("request.createdAt", "ASC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await builder.getManyAndCount();
    const reviewerIds = [...new Set(items.map((item) => item.reviewedBy).filter((id): id is string => !!id))];
    const reviewers = reviewerIds.length
      ? await this.dataSource.getRepository(User).findBy(reviewerIds.map((id) => ({ id })))
      : [];
    const reviewersById = new Map(reviewers.map((reviewer) => [reviewer.id, reviewer]));

    return {
      items: items.map((item) => toView(item, item.reviewedBy ? reviewersById.get(item.reviewedBy) : null)),
      page,
      pageSize,
      total,
    };
  }

  /**
   * F1-09 con el flujo de DEC-016: aprueba, activa la cuenta, asigna el rol y genera una
   * contrasena temporal, en una transaccion. La contrasena se entrega despues de confirmar;
   * al usarla por primera vez se verifica el correo y se obliga a cambiarla.
   */
  async approve(actor: User, id: string, dto: ApproveMembershipRequestDto, now = new Date()) {
    this.assertCanAssign(actor, dto.roleCode);

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwords.hash(temporaryPassword);

    const { view, user, expiresAt } = await this.dataSource.transaction(async (manager) => {
      const request = await this.findPending(manager, id);
      const role = await manager.findOneByOrFail(Role, { code: dto.roleCode });

      await this.resolve(manager, id, {
        status: "approved",
        approvedRoleId: role.id,
        reviewedBy: actor.id,
        reviewedAt: now,
        reviewComment: dto.comment || null,
      });
      await manager.update(User, { id: request.userId }, { accountStatus: "active" });
      await manager.createQueryBuilder().relation(User, "roles").of(request.userId).add(role.id);
      const expiresAt = await applyTemporaryPassword(manager, request.userId, passwordHash, now);
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "membership_request.approved",
        targetType: "user",
        targetId: request.userId,
        details: { membershipRequestId: id, role: role.code, accountStatus: "active", temporaryPassword: "issued" },
      });

      return { view: toView(await this.reload(manager, id), actor), user: request.user, expiresAt };
    });

    const credentials = await deliverTemporaryPassword(this.mailer, this.config, {
      email: user.emailNormalized,
      fullName: user.fullName,
      password: temporaryPassword,
      expiresAt,
      reason: "approved",
    });

    return { ...view, credentials };
  }

  async reject(actor: User, id: string, dto: RejectMembershipRequestDto, now = new Date()) {
    return this.dataSource.transaction(async (manager) => {
      const request = await this.findPending(manager, id);

      await this.resolve(manager, id, {
        status: "rejected",
        reviewedBy: actor.id,
        reviewedAt: now,
        reviewComment: dto.comment || null,
      });
      await manager.update(User, { id: request.userId }, { accountStatus: "rejected" });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "membership_request.rejected",
        targetType: "user",
        targetId: request.userId,
        details: { membershipRequestId: id, accountStatus: "rejected" },
      });

      return toView(await this.reload(manager, id), actor);
    });
  }

  private assertCanAssign(actor: User, role: RoleCode) {
    if (!canAssignRole(roleCodes(actor), role)) {
      throw new ApiError(403, "ROLE_NOT_ASSIGNABLE", "No puedes asignar ese rol");
    }
  }

  private async findPending(manager: EntityManager, id: string) {
    const request = await manager.findOne(MembershipRequest, { where: { id }, relations: { user: true } });

    if (!request) {
      throw new ApiError(404, "MEMBERSHIP_REQUEST_NOT_FOUND", "Solicitud no encontrada");
    }

    if (request.status !== "pending") {
      throw new ApiError(409, "REQUEST_ALREADY_RESOLVED", "La solicitud ya fue resuelta");
    }

    return request;
  }

  /** Transicion condicionada a `pending`: una solicitud resuelta no se puede resolver de nuevo. */
  private async resolve(manager: EntityManager, id: string, changes: Partial<MembershipRequest>) {
    const result = await manager.update(MembershipRequest, { id, status: "pending" }, changes);

    if (result.affected !== 1) {
      throw new ApiError(409, "REQUEST_ALREADY_RESOLVED", "La solicitud ya fue resuelta");
    }
  }

  private reload(manager: EntityManager, id: string) {
    return manager.findOneOrFail(MembershipRequest, {
      where: { id },
      relations: { user: true, approvedRole: true },
    });
  }
}
