import { Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";

import { ApiError } from "../../common/api-error";
import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { generateTemporaryPassword } from "../../common/temporary-password";
import { recordAudit } from "../audit/audit";
import { PasswordService } from "../auth/password.service";
import { MAILER, type Mailer } from "../mail/mailer";
import { canAssignRole, canManageUser, isAuthority } from "../roles/role-policy";
import { Role, type RoleCode } from "../roles/role.entity";
import type { ListUsersQuery, UpdateUserStatusDto } from "./dto/users.dto";
import { applyTemporaryPassword, deliverTemporaryPassword } from "./temporary-credentials";
import { type AccountStatus, User } from "./user.entity";
import { deactivateAccount } from "./deactivate-account";

function roleCodes(user: User): RoleCode[] {
  return (user.roles ?? []).map((role) => role.code).sort();
}

/** Vista para cualquier integrante: solo datos no sensibles (matriz F1). */
function toMemberView(user: User) {
  return { id: user.id, fullName: user.fullName, roles: roleCodes(user) };
}

/** Vista de administracion: sin `passwordHash`, tokens ni sesiones. */
function toAdminView(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.emailNormalized,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerifiedAt !== null,
    mustChangePassword: user.mustChangePassword,
    roles: roleCodes(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Escapa comodines de LIKE para que la busqueda sea literal. */
function likePattern(value: string) {
  return `%${value.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/** Transiciones de estado administrables (F1-13). `pending` se resuelve con la cola de solicitudes. */
const ALLOWED_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  active: ["inactive"],
  inactive: ["active"],
  rejected: ["active"],
  pending: [],
};

@Injectable()
export class MembersService {
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

  async list(actor: User, query: ListUsersQuery) {
    const authority = isAuthority(roleCodes(actor));

    if (!authority && query.status && query.status !== "active") {
      throw new ApiError(403, "FORBIDDEN", "Solo puedes consultar integrantes activos");
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const builder = this.dataSource
      .getRepository(User)
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.roles", "role")
      .where("user.accountStatus = :status", { status: query.status ?? "active" })
      .orderBy("user.fullName", "ASC")
      .addOrderBy("user.id", "ASC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (query.q) {
      const search = authority
        ? "(LOWER(user.fullName) LIKE :q ESCAPE '\\' OR user.emailNormalized LIKE :q ESCAPE '\\')"
        : "LOWER(user.fullName) LIKE :q ESCAPE '\\'";
      builder.andWhere(search, { q: likePattern(query.q) });
    }

    if (query.role) {
      builder.andWhere(
        "user.id IN (SELECT ur.user_id FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE r.code = :role)",
        { role: query.role },
      );
    }

    const [users, total] = await builder.getManyAndCount();

    return { items: users.map(authority ? toAdminView : toMemberView), page, pageSize, total };
  }

  async detail(id: string) {
    return toAdminView(await this.findUser(this.dataSource.manager, id));
  }

  async updateStatus(actor: User, id: string, dto: UpdateUserStatusDto, now = new Date()) {
    this.assertNotSelf(actor, id, "CANNOT_CHANGE_OWN_STATUS", "No puedes cambiar tu propio estado");

    // Se prepara fuera de la transaccion por el costo de Argon2; solo se usa si hace falta.
    const temporaryPassword = dto.status === "active" ? generateTemporaryPassword() : null;
    const temporaryHash = temporaryPassword ? await this.passwords.hash(temporaryPassword) : null;

    const result = await this.dataSource.transaction(async (manager) => {
      const target = await this.findUser(manager, id);
      this.assertCanManage(actor, target);

      const from = target.accountStatus;
      const to = dto.status;

      if (from === to) {
        return { view: toAdminView(target), issued: null };
      }

      if (!ALLOWED_TRANSITIONS[from].includes(to)) {
        throw new ApiError(
          409,
          "INVALID_STATUS_TRANSITION",
          from === "pending"
            ? "Las cuentas pendientes se resuelven desde la cola de solicitudes"
            : `No se puede pasar de ${from} a ${to}`,
        );
      }

      let assignedRole: RoleCode | null = null;

      // Una cuenta activa debe tener al menos un rol institucional.
      if (to === "active" && roleCodes(target).length === 0) {
        if (!dto.roleCode) {
          throw new ApiError(409, "ROLE_REQUIRED", "Indica el rol con el que se activara la cuenta");
        }

        this.assertCanAssign(actor, dto.roleCode);
        const role = await manager.findOneByOrFail(Role, { code: dto.roleCode });
        await manager.createQueryBuilder().relation(User, "roles").of(target.id).add(role.id);
        assignedRole = role.code;
      }

      if (to === "inactive") {
        await deactivateAccount(manager, actor, target, dto.reason || null, now);
        return { view: toAdminView(await this.findUser(manager, target.id)), issued: null };
      }

      await manager.update(User, { id: target.id }, { accountStatus: to });

      // Quien nunca ingreso (p. ej. una solicitud rechazada) recibe una contrasena temporal (DEC-016).
      let issued: Date | null = null;

      if (to === "active" && (from === "rejected" || target.emailVerifiedAt === null)) {
        issued = await applyTemporaryPassword(manager, target.id, temporaryHash!, now);
      }

      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "user.status_changed",
        targetType: "user",
        targetId: target.id,
        details: { from, to, reason: dto.reason || null, assignedRole, temporaryPassword: issued ? "issued" : null },
      });

      return { view: toAdminView(await this.findUser(manager, target.id)), issued };
    });

    if (!result.issued) {
      return result.view;
    }

    const credentials = await deliverTemporaryPassword(this.mailer, this.config, {
      email: result.view.email,
      fullName: result.view.fullName,
      password: temporaryPassword!,
      expiresAt: result.issued,
      reason: "reactivated",
    });

    return { ...result.view, credentials };
  }

  /**
   * Genera una nueva contrasena temporal (si el correo fallo, se perdio o vencio): obliga a
   * cambiarla, cierra las sesiones de la persona y la entrega por correo.
   */
  async reissueTemporaryPassword(actor: User, id: string, now = new Date()) {
    this.assertNotSelf(actor, id, "CANNOT_RESET_OWN_PASSWORD", "Usa el cambio de contrasena para tu propia cuenta");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwords.hash(temporaryPassword);

    const { view, expiresAt } = await this.dataSource.transaction(async (manager) => {
      const target = await this.findUser(manager, id);
      this.assertCanManage(actor, target);

      if (target.accountStatus !== "active") {
        throw new ApiError(409, "INVALID_ACCOUNT_STATUS", "Solo se generan contrasenas temporales para cuentas activas");
      }

      const expiresAt = await applyTemporaryPassword(manager, target.id, passwordHash, now);
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "user.temporary_password_issued",
        targetType: "user",
        targetId: target.id,
        details: { sessionsRevoked: true },
      });

      return { view: toAdminView(await this.findUser(manager, target.id)), expiresAt };
    });

    const credentials = await deliverTemporaryPassword(this.mailer, this.config, {
      email: view.email,
      fullName: view.fullName,
      password: temporaryPassword,
      expiresAt,
      reason: "reissued",
    });

    return { ...view, credentials };
  }

  async assignRole(actor: User, id: string, roleCode: RoleCode) {
    this.assertNotSelf(actor, id, "CANNOT_CHANGE_OWN_ROLES", "No puedes cambiar tus propios roles");
    this.assertCanAssign(actor, roleCode);

    return this.dataSource.transaction(async (manager) => {
      const target = await this.findUser(manager, id);
      this.assertCanManage(actor, target);

      if (target.accountStatus === "pending" || target.accountStatus === "rejected") {
        throw new ApiError(409, "INVALID_ACCOUNT_STATUS", "Solo se asignan roles a cuentas activas o inactivas");
      }

      if (roleCodes(target).includes(roleCode)) {
        throw new ApiError(409, "ROLE_ALREADY_ASSIGNED", "La persona ya tiene ese rol");
      }

      const role = await manager.findOneByOrFail(Role, { code: roleCode });
      await manager.createQueryBuilder().relation(User, "roles").of(target.id).add(role.id);
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "user.role_assigned",
        targetType: "user",
        targetId: target.id,
        details: { role: roleCode },
      });

      return toAdminView(await this.findUser(manager, target.id));
    });
  }

  async removeRole(actor: User, id: string, roleCode: RoleCode) {
    this.assertNotSelf(actor, id, "CANNOT_CHANGE_OWN_ROLES", "No puedes cambiar tus propios roles");
    this.assertCanAssign(actor, roleCode);

    return this.dataSource.transaction(async (manager) => {
      const target = await this.findUser(manager, id);
      this.assertCanManage(actor, target);
      const current = roleCodes(target);

      if (!current.includes(roleCode)) {
        throw new ApiError(409, "ROLE_NOT_ASSIGNED", "La persona no tiene ese rol");
      }

      if (target.accountStatus === "active" && current.length === 1) {
        throw new ApiError(409, "ROLE_REQUIRED", "Una cuenta activa debe conservar al menos un rol");
      }

      if (roleCode === "admin") {
        await this.assertNotLastActiveAdmin(manager, target.id);
      }

      const role = await manager.findOneByOrFail(Role, { code: roleCode });
      await manager.createQueryBuilder().relation(User, "roles").of(target.id).remove(role.id);
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "user.role_removed",
        targetType: "user",
        targetId: target.id,
        details: { role: roleCode },
      });

      return toAdminView(await this.findUser(manager, target.id));
    });
  }

  private async findUser(manager: EntityManager, id: string) {
    const user = await manager.findOne(User, { where: { id }, relations: { roles: true } });

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "Integrante no encontrado");
    }

    return user;
  }

  private assertNotSelf(actor: User, id: string, code: string, message: string) {
    // Nadie eleva ni reduce sus propios permisos; otra autoridad debe hacerlo.
    if (actor.id === id) {
      throw new ApiError(403, code, message);
    }
  }

  private assertCanAssign(actor: User, role: RoleCode) {
    if (!canAssignRole(roleCodes(actor), role)) {
      throw new ApiError(403, "ROLE_NOT_ASSIGNABLE", "No puedes asignar ni retirar ese rol");
    }
  }

  private assertCanManage(actor: User, target: User) {
    if (!canManageUser(roleCodes(actor), roleCodes(target))) {
      throw new ApiError(403, "USER_NOT_MANAGEABLE", "No puedes administrar a esta persona");
    }
  }

  /** El sistema nunca puede quedarse sin un `admin` activo (matriz de permisos F1). */
  private async assertNotLastActiveAdmin(manager: EntityManager, excludingUserId: string) {
    const others = await countActiveAdmins(manager, excludingUserId);

    if (others === 0) {
      throw new ApiError(409, "LAST_ADMIN", "No se puede dejar el sistema sin un administrador activo");
    }
  }
}

export function countActiveAdmins(manager: EntityManager, excludingUserId?: string) {
  const builder = manager
    .getRepository(User)
    .createQueryBuilder("user")
    .innerJoin("user.roles", "role", "role.code = :code", { code: "admin" })
    .where("user.accountStatus = :status", { status: "active" });

  if (excludingUserId) {
    builder.andWhere("user.id != :id", { id: excludingUserId });
  }

  return builder.getCount();
}
