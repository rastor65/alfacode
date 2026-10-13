import { type EntityManager, IsNull } from "typeorm";

import type { SecurityConfig } from "../../common/security.config";
import { TEMPORARY_PASSWORD_TTL_MS } from "../../common/temporary-password";
import { Session } from "../auth/session.entity";
import { deliverMail } from "../mail/deliver";
import type { Mailer } from "../mail/mailer";
import { User } from "./user.entity";

/**
 * Resultado de entregar una contrasena temporal (DEC-016):
 * - `email`: se envio al correo institucional.
 * - `manual`: no hay correo real; se devuelve una sola vez a quien aprobo para que la entregue.
 * - `failed`: el envio fallo; la cuenta queda lista y se puede regenerar con
 *   `POST /users/:id/temporary-password`.
 */
export type TemporaryCredentials =
  | { delivery: "email" | "failed"; expiresAt: Date }
  | { delivery: "manual"; expiresAt: Date; temporaryPassword: string };

export type TemporaryPasswordReason = "approved" | "reactivated" | "reissued";

/** Fija la contrasena temporal (ya hasheada), obliga a cambiarla y cierra sesiones abiertas. */
export async function applyTemporaryPassword(manager: EntityManager, userId: string, passwordHash: string, now: Date) {
  const expiresAt = new Date(now.getTime() + TEMPORARY_PASSWORD_TTL_MS);

  await manager.update(User, { id: userId }, { passwordHash, mustChangePassword: true, passwordExpiresAt: expiresAt });
  await manager.update(Session, { userId, revokedAt: IsNull() }, { revokedAt: now });

  return expiresAt;
}

const INTRO: Record<TemporaryPasswordReason, string> = {
  approved: "Tu solicitud de vinculacion a AlfaCode HUB fue aprobada.",
  reactivated: "Tu cuenta de AlfaCode HUB fue habilitada.",
  reissued: "Se genero una nueva contrasena temporal para tu cuenta de AlfaCode HUB.",
};

/** Envia la contrasena temporal despues de confirmar la transaccion. Nunca la registra en logs. */
export async function deliverTemporaryPassword(
  mailer: Mailer,
  config: SecurityConfig,
  input: { email: string; fullName: string; password: string; expiresAt: Date; reason: TemporaryPasswordReason },
): Promise<TemporaryCredentials> {
  if (mailer.transport === "none") {
    return { delivery: "manual", expiresAt: input.expiresAt, temporaryPassword: input.password };
  }

  try {
    await deliverMail(mailer, {
      to: input.email,
      subject: "AlfaCode HUB: tu acceso",
      text: [
        `Hola, ${input.fullName}.`,
        "",
        INTRO[input.reason],
        "",
        `Correo: ${input.email}`,
        `Contrasena temporal: ${input.password}`,
        "",
        `Ingresa en ${config.publicAppUrl}/ingresar. Al hacerlo, el sistema te pedira elegir una`,
        "contrasena nueva. La temporal vence en 72 horas y deja de servir en cuanto la cambies.",
        "",
        "Si no solicitaste acceso, ignora este mensaje.",
      ].join("\n"),
    });
    return { delivery: "email", expiresAt: input.expiresAt };
  } catch {
    // `deliverMail` ya registro el motivo tecnico sin el contenido.
    return { delivery: "failed", expiresAt: input.expiresAt };
  }
}
