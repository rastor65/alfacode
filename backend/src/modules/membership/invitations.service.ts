import { Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, IsNull, QueryFailedError } from "typeorm";

import { ApiError } from "../../common/api-error";
import { assertAllowedEmail } from "../../common/email-domain";
import { RateLimiterService } from "../../common/rate-limiter.service";
import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { generateSecureToken, hashToken } from "../../common/tokens";
import { recordAudit } from "../audit/audit";
import { PasswordService } from "../auth/password.service";
import { deliverMail } from "../mail/deliver";
import { MAILER, type Mailer } from "../mail/mailer";
import { canAssignRole } from "../roles/role-policy";
import { Role } from "../roles/role.entity";
import { User } from "../users/user.entity";
import { normalizeEmail } from "../users/users.service";
import type { AcceptInvitationDto, CreateInvitationDto } from "./dto/membership.dto";
import { Invitation } from "./invitation.entity";

/** Caducidad inicial de 72 horas (F1-10). */
export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export const ACCEPT_INVITATION_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

const INVALID_TOKEN = () => new ApiError(400, "INVALID_TOKEN", "El enlace no es valido o ya expiro");

const EMAIL_ALREADY_REGISTERED = () =>
  new ApiError(409, "EMAIL_ALREADY_REGISTERED", "Ya existe una cuenta con ese correo");

@Injectable()
export class InvitationsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(PasswordService)
    private readonly passwords: PasswordService,
    @Inject(RateLimiterService)
    private readonly rateLimiter: RateLimiterService,
    @Inject(MAILER)
    private readonly mailer: Mailer,
    @Inject(SECURITY_CONFIG)
    private readonly config: SecurityConfig,
  ) {}

  /**
   * Crea una invitacion de un solo uso. Revoca las invitaciones abiertas anteriores para el
   * mismo correo, de modo que solo el ultimo enlace sea valido.
   */
  async create(actor: User, dto: CreateInvitationDto, now = new Date()) {
    if (!canAssignRole((actor.roles ?? []).map((role) => role.code), dto.roleCode)) {
      throw new ApiError(403, "ROLE_NOT_ASSIGNABLE", "No puedes asignar ese rol");
    }

    const email = normalizeEmail(dto.email);
    assertAllowedEmail(email, this.config.allowedEmailDomains);
    const token = generateSecureToken();
    const acceptUrl = `${this.config.publicAppUrl}/invitacion#token=${token}`;

    const invitation = await this.dataSource.transaction(async (manager) => {
      // Cualquier cuenta existente (activa, pendiente o rechazada) requiere otro flujo explicito.
      if (await manager.existsBy(User, { emailNormalized: email })) {
        throw EMAIL_ALREADY_REGISTERED();
      }

      const role = await manager.findOneByOrFail(Role, { code: dto.roleCode });

      await manager.update(
        Invitation,
        { emailNormalized: email, acceptedAt: IsNull(), revokedAt: IsNull() },
        { revokedAt: now },
      );
      const created = await manager.save(
        manager.create(Invitation, {
          emailNormalized: email,
          roleId: role.id,
          tokenHash: hashToken(token),
          invitedBy: actor.id,
          expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
          acceptedAt: null,
          acceptedUserId: null,
          revokedAt: null,
        }),
      );
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "invitation.created",
        targetType: "invitation",
        targetId: created.id,
        details: { role: role.code },
      });

      return created;
    });

    // Envio despues de confirmar la transaccion (no se bloquea la base durante el envio por red).
    // Si falla, la invitacion se revoca para que no quede un enlace que nadie recibio.
    if (this.mailer.transport !== "none") {
      try {
        await deliverMail(this.mailer, {
          to: email,
          subject: "AlfaCode HUB: invitacion",
          text: [
            `${actor.fullName} te invito a unirte a AlfaCode HUB.`,
            "",
            "Para crear tu cuenta abre el siguiente enlace (valido por 72 horas y de un solo uso):",
            "",
            acceptUrl,
            "",
            "Si no esperabas esta invitacion, ignora este mensaje.",
          ].join("\n"),
        });
      } catch (error) {
        await this.dataSource.transaction(async (manager) => {
          await manager.update(Invitation, { id: invitation.id, acceptedAt: IsNull() }, { revokedAt: new Date() });
          await recordAudit(manager, {
            actorUserId: actor.id,
            action: "invitation.revoked",
            targetType: "invitation",
            targetId: invitation.id,
            details: { reason: "mail_delivery_failed" },
          });
        });
        throw error;
      }
    }

    const view = {
      id: invitation.id,
      email,
      role: dto.roleCode,
      expiresAt: invitation.expiresAt,
    };

    // Sin correo real (demo interna): el enlace se muestra una sola vez a quien invita y no se
    // guarda ni se registra en logs (F1-11).
    return this.mailer.transport === "none"
      ? { ...view, delivery: "manual" as const, acceptUrl }
      : { ...view, delivery: "email" as const };
  }

  /** F1-10: la aceptacion crea una cuenta `active` con el correo verificado y el rol autorizado. */
  async accept(dto: AcceptInvitationDto, ip: string, now = new Date()) {
    const { limit, windowMs } = ACCEPT_INVITATION_RATE_LIMIT;
    this.rateLimiter.consume(`invitation-accept:ip:${ip}`, limit, windowMs);

    const passwordHash = await this.passwords.hash(dto.password);

    try {
      await this.dataSource.transaction(async (manager) => {
        const invitation = await manager.findOne(Invitation, {
          where: { tokenHash: hashToken(dto.token) },
          relations: { role: true },
        });

        if (
          !invitation ||
          invitation.acceptedAt !== null ||
          invitation.revokedAt !== null ||
          invitation.expiresAt.getTime() <= now.getTime()
        ) {
          throw INVALID_TOKEN();
        }

        // Consumo condicionado del token: un enlace solo sirve una vez aunque llegue dos veces.
        const consumed = await manager.update(
          Invitation,
          { id: invitation.id, acceptedAt: IsNull(), revokedAt: IsNull() },
          { acceptedAt: now },
        );

        if (consumed.affected !== 1) {
          throw INVALID_TOKEN();
        }

        // Si la politica de dominios cambio despues de emitir la invitacion, ya no se acepta.
        assertAllowedEmail(invitation.emailNormalized, this.config.allowedEmailDomains);

        if (await manager.existsBy(User, { emailNormalized: invitation.emailNormalized })) {
          throw EMAIL_ALREADY_REGISTERED();
        }

        // Recibir el enlace en ese buzon demuestra la propiedad del correo.
        const user = await manager.save(
          manager.create(User, {
            fullName: dto.fullName,
            emailNormalized: invitation.emailNormalized,
            passwordHash,
            accountStatus: "active",
            emailVerifiedAt: now,
            roles: [invitation.role],
          }),
        );
        await manager.update(Invitation, { id: invitation.id }, { acceptedUserId: user.id });
        await recordAudit(manager, {
          actorUserId: user.id,
          action: "invitation.accepted",
          targetType: "user",
          targetId: user.id,
          details: { invitationId: invitation.id, role: invitation.role.code, invitedBy: invitation.invitedBy },
        });
      });
    } catch (error) {
      if (error instanceof QueryFailedError && /UNIQUE constraint failed/i.test(error.message)) {
        throw EMAIL_ALREADY_REGISTERED();
      }
      throw error;
    }

    return { message: "Cuenta creada. Ya puedes iniciar sesion." };
  }
}
