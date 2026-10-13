import { Injectable } from "@nestjs/common";

import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import type { UpdateProfileDto } from "./dto/users.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "./user.entity";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findById(id: string) {
    return this.users.findOne({ where: { id }, relations: { roles: true } });
  }

  findByEmail(email: string) {
    return this.users.findOne({
      where: { emailNormalized: normalizeEmail(email) },
      relations: { roles: true },
    });
  }

  /** Unica consulta que carga `passwordHash`; solo para verificar credenciales. */
  findByEmailWithPassword(email: string) {
    return this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .leftJoinAndSelect("user.roles", "role")
      .where("user.emailNormalized = :email", { email: normalizeEmail(email) })
      .getOne();
  }

  findByIdWithPassword(id: string) {
    return this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id })
      .getOne();
  }

  /** Marca el correo como verificado y lo audita (p. ej. al usar la contrasena temporal enviada a el). */
  async markEmailVerified(id: string, source: string, now = new Date()) {
    await this.users.manager.transaction(async (manager) => {
      await manager.update(User, { id }, { emailVerifiedAt: now });
      await recordAudit(manager, {
        actorUserId: id,
        action: "user.email_verified",
        targetType: "user",
        targetId: id,
        details: { source },
      });
    });
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    await this.users.update({ id }, { passwordHash });
  }

  /** F1-12: perfil propio. */
  async getProfile(id: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "Integrante no encontrado");
    }

    return toProfile(user);
  }

  /** Solo actualiza campos editables; el DTO rechaza rol, estado o verificacion. */
  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.users.update({ id }, { fullName: dto.fullName });
    return this.getProfile(id);
  }
}

export function toProfile(user: User) {
  return {
    ...toAuthUser(user),
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt,
  };
}

export function toAuthUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.emailNormalized,
    accountStatus: user.accountStatus,
    mustChangePassword: user.mustChangePassword,
    roles: (user.roles ?? []).map((role) => role.code).sort(),
  };
}
