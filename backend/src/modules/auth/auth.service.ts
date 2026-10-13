import { Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, IsNull, Not } from "typeorm";

import { ApiError } from "../../common/api-error";
import { assertAllowedEmail } from "../../common/email-domain";
import { RateLimiterService } from "../../common/rate-limiter.service";
import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { recordAudit } from "../audit/audit";
import { User } from "../users/user.entity";
import { UsersService, normalizeEmail } from "../users/users.service";
import type { ChangePasswordDto } from "./dto/change-password.dto";
import type { LoginDto } from "./dto/login.dto";
import { PasswordService } from "./password.service";
import { Session } from "./session.entity";
import { SessionsService } from "./sessions.service";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Limites de intentos FALLIDOS de login, en ventanas de 15 minutos. Los aciertos no cuentan,
 * para no bloquear redes compartidas (NAT del campus):
 * - cuenta+IP: frena fuerza bruta contra una cuenta sin bloquear a su dueno en otra red;
 * - cuenta: frena ataques distribuidos contra una misma cuenta;
 * - IP: frena el rociado de contrasenas sobre muchas cuentas desde un origen.
 */
export const LOGIN_RATE_LIMITS = {
  windowMs: FIFTEEN_MINUTES,
  perAccountIp: 5,
  perAccount: 20,
  perIp: 50,
};

/** Intentos fallidos de la contrasena actual al cambiarla, por usuario. */
export const CHANGE_PASSWORD_RATE_LIMIT = { limit: 5, windowMs: FIFTEEN_MINUTES };

const INVALID_CREDENTIALS = () => new ApiError(401, "INVALID_CREDENTIALS", "Correo o contrasena incorrectos");
const ACCOUNT_NOT_ACTIVE = () =>
  new ApiError(403, "ACCOUNT_NOT_ACTIVE", "La cuenta no esta habilitada para iniciar sesion");

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(UsersService)
    private readonly users: UsersService,
    @Inject(SessionsService)
    private readonly sessions: SessionsService,
    @Inject(PasswordService)
    private readonly passwords: PasswordService,
    @Inject(RateLimiterService)
    private readonly rateLimiter: RateLimiterService,
    @Inject(SECURITY_CONFIG)
    private readonly config: SecurityConfig,
  ) {}

  async login(dto: LoginDto, context: { ip: string; currentSessionToken?: string }, now = new Date()) {
    const account = normalizeEmail(dto.email);
    // Ninguna cuenta fuera del dominio institucional puede iniciar sesion, aunque existiera.
    assertAllowedEmail(account, this.config.allowedEmailDomains);
    const keys = {
      accountIp: `login:account-ip:${account}|${context.ip}`,
      account: `login:account:${account}`,
      ip: `login:ip:${context.ip}`,
    };

    // Los limites se comprueban antes de Argon2 para no gastar CPU en ataques de fuerza bruta.
    this.rateLimiter.assertAvailable(keys.accountIp, LOGIN_RATE_LIMITS.perAccountIp);
    this.rateLimiter.assertAvailable(keys.account, LOGIN_RATE_LIMITS.perAccount);
    this.rateLimiter.assertAvailable(keys.ip, LOGIN_RATE_LIMITS.perIp);

    const fail = () => {
      for (const key of Object.values(keys)) {
        this.rateLimiter.hit(key, LOGIN_RATE_LIMITS.windowMs);
      }
      return INVALID_CREDENTIALS();
    };

    const user = await this.users.findByEmailWithPassword(account);

    if (!user) {
      await this.passwords.verifyAgainstDummy(dto.password);
      throw fail();
    }

    if (!(await this.passwords.verify(user.passwordHash, dto.password))) {
      throw fail();
    }

    // El estado solo se revela a quien ya demostro conocer la contrasena.
    if (user.accountStatus !== "active") {
      throw ACCOUNT_NOT_ACTIVE();
    }

    if (user.mustChangePassword && user.passwordExpiresAt && user.passwordExpiresAt.getTime() <= now.getTime()) {
      throw new ApiError(
        403,
        "TEMPORARY_PASSWORD_EXPIRED",
        "La contrasena temporal vencio. Usa la recuperacion de contrasena o pide una nueva.",
      );
    }

    if (user.emailVerifiedAt === null) {
      // Solo la contrasena temporal enviada al correo demuestra que el buzon es de la persona.
      if (!user.mustChangePassword) {
        throw ACCOUNT_NOT_ACTIVE();
      }

      await this.users.markEmailVerified(user.id, "temporary_password", now);
      user.emailVerifiedAt = now;
    }

    this.rateLimiter.reset(keys.accountIp);

    if (this.passwords.needsRehash(user.passwordHash)) {
      await this.users.updatePasswordHash(user.id, await this.passwords.hash(dto.password));
    }

    // Rotacion: una sesion previa en el mismo navegador se revoca (evita fijacion de sesion).
    if (context.currentSessionToken) {
      await this.sessions.revoke(context.currentSessionToken);
    }

    const { token, csrfToken, session } = await this.sessions.create(user.id);

    return { user, token, csrfToken, expiresAt: session.expiresAt };
  }

  /**
   * Cambia la contrasena con la actual (o la temporal). Quita la obligacion de cambiarla y
   * revoca las demas sesiones de la cuenta; la sesion actual sigue abierta.
   */
  async changePassword(userId: string, currentSessionId: string, dto: ChangePasswordDto, now = new Date()) {
    const key = `change-password:${userId}`;
    this.rateLimiter.assertAvailable(key, CHANGE_PASSWORD_RATE_LIMIT.limit);

    const user = await this.users.findByIdWithPassword(userId);

    if (!user || !(await this.passwords.verify(user.passwordHash, dto.currentPassword))) {
      this.rateLimiter.hit(key, CHANGE_PASSWORD_RATE_LIMIT.windowMs);
      throw new ApiError(400, "INVALID_CURRENT_PASSWORD", "La contrasena actual no es correcta");
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new ApiError(400, "PASSWORD_UNCHANGED", "La nueva contrasena debe ser distinta de la actual");
    }

    this.rateLimiter.reset(key);
    const passwordHash = await this.passwords.hash(dto.newPassword);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, { id: userId }, { passwordHash, mustChangePassword: false, passwordExpiresAt: null });
      // Prueba de aceptacion F1-7: cambiar la contrasena invalida las sesiones anteriores.
      await manager.update(
        Session,
        { userId, id: Not(currentSessionId), revokedAt: IsNull() },
        { revokedAt: now },
      );
      await recordAudit(manager, {
        actorUserId: userId,
        action: "user.password_changed",
        targetType: "user",
        targetId: userId,
        details: { wasTemporary: user.mustChangePassword, otherSessionsRevoked: true },
      });
    });

    return this.users.getProfile(userId);
  }
}
