import { Logger } from "@nestjs/common";

import { ApiError } from "../../common/api-error";
import type { MailMessage, Mailer } from "./mailer";

const logger = new Logger("Mail");

export const MAIL_DELIVERY_FAILED = () =>
  new ApiError(503, "MAIL_DELIVERY_FAILED", "No pudimos enviar el correo. Intenta de nuevo en unos minutos.");

/**
 * Envia un correo y convierte cualquier fallo del transporte en un 503 uniforme. Solo se
 * registra el motivo tecnico (p. ej. "535 credenciales rechazadas"), nunca el contenido:
 * los correos llevan enlaces con tokens.
 */
export async function deliverMail(mailer: Mailer, message: MailMessage) {
  try {
    await mailer.send(message);
  } catch (error) {
    logger.error(`No se pudo enviar "${message.subject}": ${error instanceof Error ? error.message : String(error)}`);
    throw MAIL_DELIVERY_FAILED();
  }
}
