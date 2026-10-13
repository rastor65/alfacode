import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, IsNull } from "typeorm";

import { ApiError } from "../../common/api-error";
import { assertAllowedEmail } from "../../common/email-domain";
import { RateLimiterService } from "../../common/rate-limiter.service";
import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { generateSecureToken, hashToken } from "../../common/tokens";
import { recordAudit } from "../audit/audit";
import { MAILER, type Mailer } from "../mail/mailer";
import { User } from "../users/user.entity";
import { normalizeEmail } from "../users/users.service";
import { PasswordService } from "./password.service";
import { Session } from "./session.entity";
import { VerificationToken } from "./verification-token.entity";

/** Token efimero de un solo uso (F1-06). */
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

const HOUR = 60 * 60 * 1000;
export const PASSWORD_RESET_RATE_LIMITS = {
  requestPerIp: { limit: 10, windowMs: 15 * 60 * 1000 },
  /** Evita inundar un buzon con correos de recuperacion. */
  requestPerAccount: { limit: 3, windowMs: HOUR },
  resetPerIp: { limit: 10, windowMs: 15 * 60 * 1000 },
};

/** Respuesta identica exista o no la cuenta (F1-06: no revelar existencia de cuentas). */
export const PASSWORD_RESET_REQUESTED_MESSAGE =
  "Si existe una cuenta activa con ese correo, enviaremos un enlace para restablecer la contrasena.";

const INVALID_TOKEN = () => new ApiError(400, "INVALID_TOKEN", "El enlace no es valido o ya expiro");

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger("PasswordResetService");

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

  async request(rawEmail: string, ip: string, now = new Date()) {
    // Sin correo real no se declara operativo el flujo de recuperacion (plan, seccion 2.3).
    if (this.mailer.transport === "none") {
      throw new ApiError(503, "PASSWORD_RESET_DISABLED", "La recuperacion de contrasena no esta disponible por ahora");
    }

    const email = normalizeEmail(rawEmail);
    assertAllowedEmail(email, this.config.allowedEmailDomains);

    const { requestPerIp, requestPerAccount } = PASSWORD_RESET_RATE_LIMITS;
    this.rateLimiter.consume(`password-reset:ip:${ip}`, requestPerIp.limit, requestPerIp.windowMs);
    this.rateLimiter.consume(`password-reset:account:${email}`, requestPerAccount.limit, requestPerAccount.windowMs);

    const user = await this.dataSource.getRepository(User).findOneBy({ emailNormalized: email });

    // Solo cuentas activas; para el resto no se hace nada y la respuesta es igual. Incluye a quien
    // aun no uso su contrasena temporal: el enlace llega a su correo, que asi queda verificado.
    if (!user || user.accountStatus !== "active") {
      return { message: PASSWORD_RESET_REQUESTED_MESSAGE };
    }

    const token = generateSecureToken();

    await this.dataSource.transaction(async (manager) => {
      // Solo el ultimo enlace sirve: los anteriores sin usar se invalidan.
      await manager.update(
        VerificationToken,
        { userId: user.id, purpose: "password_reset", usedAt: IsNull() },
        { usedAt: now },
      );
      await manager.save(
        manager.create(VerificationToken, {
          userId: user.id,
          purpose: "password_reset",
          tokenHash: hashToken(token),
          expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
          usedAt: null,
        }),
      );
    });

    // No se espera el envio: el tiempo de respuesta no debe delatar que la cuenta existe.
    void this.mailer
      .send({
        to: email,
        subject: "AlfaCode HUB: restablecer contrasena",
        text: [
          `Hola, ${user.fullName}.`,
          "",
          "Recibimos una solicitud para restablecer la contrasena de tu cuenta.",
          "Abre el siguiente enlace (valido por 30 minutos y de un solo uso):",
          "",
          `${this.config.publicAppUrl}/restablecer-contrasena#token=${token}`,
          "",
          "Al cambiarla se cerraran todas tus sesiones abiertas.",
          "Si no fuiste tu, ignora este mensaje: tu contrasena actual seguira funcionando.",
        ].join("\n"),
      })
      .catch((error: unknown) => {
        this.logger.error(`No se pudo enviar el correo de recuperacion: ${error instanceof Error ? error.message : error}`);
      });

    return { message: PASSWORD_RESET_REQUESTED_MESSAGE };
  }

  /** Cambia la contrasena con un token valido y revoca todas las sesiones de la cuenta. */
  async reset(token: string, password: string, ip: string, now = new Date()) {
    const { resetPerIp } = PASSWORD_RESET_RATE_LIMITS;
    this.rateLimiter.consume(`password-reset-confirm:ip:${ip}`, resetPerIp.limit, resetPerIp.windowMs);

    const passwordHash = await this.passwords.hash(password);

    await this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(VerificationToken, {
        where: { tokenHash: hashToken(token), purpose: "password_reset" },
        relations: { user: true },
      });

      if (
        !record ||
        record.usedAt !== null ||
        record.expiresAt.getTime() <= now.getTime() ||
        record.user.accountStatus !== "active"
      ) {
        throw INVALID_TOKEN();
      }

      // Consumo condicionado: el enlace solo sirve una vez aunque llegue dos veces.
      const consumed = await manager.update(VerificationToken, { id: record.id, usedAt: IsNull() }, { usedAt: now });

      if (consumed.affected !== 1) {
        throw INVALID_TOKEN();
      }

      await manager.update(
        User,
        { id: record.userId },
        {
          passwordHash,
          mustChangePassword: false,
          passwordExpiresAt: null,
          // Abrir el enlace enviado al correo demuestra que el buzon es de la persona.
          emailVerifiedAt: record.user.emailVerifiedAt ?? now,
        },
      );
      // Prueba de aceptacion F1-7: cambiar la contrasena invalida las sesiones anteriores.
      await manager.update(Session, { userId: record.userId, revokedAt: IsNull() }, { revokedAt: now });
      await recordAudit(manager, {
        actorUserId: record.userId,
        action: "user.password_reset",
        targetType: "user",
        targetId: record.userId,
        details: { sessionsRevoked: true },
      });
    });

    return { message: "Contrasena actualizada. Inicia sesion con la nueva contrasena." };
  }
}
