import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import type { DataSource } from "typeorm";

import { DEFAULT_ALLOWED_EMAIL_DOMAINS, isAllowedEmail } from "../../common/email-domain";
import { IsEmailField, IsFullName, IsNewPassword } from "../../common/validation";
import { recordAudit } from "../audit/audit";
import type { PasswordService } from "../auth/password.service";
import { Role } from "../roles/role.entity";
import { User } from "./user.entity";
import { normalizeEmail } from "./users.service";

export class BootstrapAdminInput {
  @IsFullName()
  fullName!: string;

  @IsEmailField()
  email!: string;

  @IsNewPassword()
  password!: string;
}

export class BootstrapAdminError extends Error {}

/**
 * F1-04: crea el primer administrador. Es de un solo uso: falla si ya existe cualquier
 * usuario con rol `admin`, de modo que nunca reemplaza administradores existentes.
 */
export async function bootstrapAdmin(
  dataSource: DataSource,
  passwords: PasswordService,
  raw: BootstrapAdminInput,
  allowedEmailDomains: readonly string[] = DEFAULT_ALLOWED_EMAIL_DOMAINS,
) {
  const input = plainToInstance(BootstrapAdminInput, raw);
  const errors = await validate(input, { whitelist: true, forbidNonWhitelisted: true });

  if (errors.length > 0) {
    const fields = errors.map((error) => error.property).join(", ");
    throw new BootstrapAdminError(
      `Datos invalidos (${fields}). La contrasena debe tener entre 12 y 128 caracteres.`,
    );
  }

  if (!isAllowedEmail(input.email, allowedEmailDomains)) {
    throw new BootstrapAdminError(
      `Solo se admiten correos institucionales (${allowedEmailDomains.map((domain) => `@${domain}`).join(", ")}).`,
    );
  }

  const passwordHash = await passwords.hash(input.password);

  return dataSource.transaction(async (manager) => {
    const adminRole = await manager.findOneBy(Role, { code: "admin" });

    if (!adminRole) {
      throw new BootstrapAdminError("No existe el rol admin; ejecuta primero `npm run seed:roles`.");
    }

    const existingAdmins = await manager
      .getRepository(User)
      .createQueryBuilder("user")
      .innerJoin("user.roles", "role", "role.code = :code", { code: "admin" })
      .getCount();

    if (existingAdmins > 0) {
      throw new BootstrapAdminError("Ya existe un administrador; este comando solo puede usarse una vez.");
    }

    const email = normalizeEmail(input.email);

    if (await manager.existsBy(User, { emailNormalized: email })) {
      throw new BootstrapAdminError("Ya existe una cuenta con ese correo.");
    }

    // La persona responsable que ejecuta el comando da fe del correo.
    const user = await manager.save(
      manager.create(User, {
        fullName: input.fullName,
        emailNormalized: email,
        passwordHash,
        accountStatus: "active",
        emailVerifiedAt: new Date(),
        roles: [adminRole],
      }),
    );
    await recordAudit(manager, {
      actorUserId: null,
      action: "admin.bootstrapped",
      targetType: "user",
      targetId: user.id,
      details: { role: "admin", source: "cli" },
    });

    return { id: user.id, email };
  });
}
