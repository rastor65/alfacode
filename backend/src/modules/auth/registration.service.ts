import { Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, QueryFailedError } from "typeorm";

import { ApiError } from "../../common/api-error";
import { assertAllowedEmail } from "../../common/email-domain";
import { RateLimiterService } from "../../common/rate-limiter.service";
import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { generateSecureToken } from "../../common/tokens";
import { recordAudit } from "../audit/audit";
import { MAILER, type Mailer } from "../mail/mailer";
import { MembershipRequest } from "../membership/membership-request.entity";
import { User } from "../users/user.entity";
import { normalizeEmail } from "../users/users.service";
import type { RegisterDto } from "./dto/registration.dto";
import { PasswordService } from "./password.service";

const HOUR = 60 * 60 * 1000;
export const REGISTRATION_RATE_LIMITS = {
  registerPerIp: { limit: 10, windowMs: HOUR },
};

/** Respuesta identica exista o no la cuenta, para no revelar correos registrados. */
export const REGISTRATION_ACCEPTED_MESSAGE =
  "Recibimos tu solicitud. Si es aprobada, te enviaremos a tu correo institucional una contrasena temporal para ingresar.";

function isUniqueViolation(error: unknown) {
  return error instanceof QueryFailedError && /UNIQUE constraint failed/i.test(error.message);
}

@Injectable()
export class RegistrationService {
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
   * Solicitud de vinculacion (DEC-016): crea un usuario `pending` sin contrasena utilizable y
   * su solicitud `pending`. No envia correos; al aprobarla se genera y envia una contrasena
   * temporal, y recibirla demuestra la propiedad del correo.
   */
  async register(dto: RegisterDto, ip: string) {
    // Sin correo real no se habilita el auto-registro publico (plan-desarrollo, seccion 2.3),
    // salvo que se habilite explicitamente con ENABLE_PUBLIC_REGISTRATION=true (DEC-016).
    if (this.mailer.transport === "none" && process.env.ENABLE_PUBLIC_REGISTRATION !== "true") {
      throw new ApiError(503, "REGISTRATION_DISABLED", "El registro publico no esta disponible por ahora");
    }

    const { limit, windowMs } = REGISTRATION_RATE_LIMITS.registerPerIp;
    this.rateLimiter.consume(`register:ip:${ip}`, limit, windowMs);

    const email = normalizeEmail(dto.email);
    assertAllowedEmail(email, this.config.allowedEmailDomains);
    // Contrasena inutilizable (secreto aleatorio que nadie conoce) hasta la aprobacion. Se
    // calcula siempre, exista o no la cuenta, para que el tiempo de respuesta no la delate.
    const unusablePasswordHash = await this.passwords.hash(generateSecureToken());

    if (await this.dataSource.getRepository(User).existsBy({ emailNormalized: email })) {
      return { message: REGISTRATION_ACCEPTED_MESSAGE };
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(
          manager.create(User, {
            fullName: dto.fullName,
            emailNormalized: email,
            passwordHash: unusablePasswordHash,
            accountStatus: "pending",
            emailVerifiedAt: null,
            mustChangePassword: false,
            passwordExpiresAt: null,
          }),
        );
        const request = await manager.save(
          manager.create(MembershipRequest, {
            userId: user.id,
            status: "pending",
            message: dto.message || null,
            cvData: dto.cvData || null,
          }),
        );
        await recordAudit(manager, {
          actorUserId: null,
          action: "user.registered",
          targetType: "user",
          targetId: user.id,
          details: { membershipRequestId: request.id },
        });
      });
    } catch (error) {
      // Dos solicitudes simultaneas con el mismo correo: se responde igual que si ya existiera.
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }

    return { message: REGISTRATION_ACCEPTED_MESSAGE };
  }
}
