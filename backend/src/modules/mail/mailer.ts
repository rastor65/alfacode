export const MAILER = Symbol("MAILER");

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Interfaz reemplazable de correo transaccional (F1-11).
 * - `outbox`: escribe cada correo en un archivo local (solo desarrollo).
 * - `memory`: guarda los correos en memoria (pruebas).
 * - `smtp`: envio real por SMTP (p. ej. Google con contrasena de aplicacion).
 * - `none`: no hay transporte real; el registro publico queda deshabilitado y las
 *   invitaciones devuelven el enlace una sola vez a quien las crea.
 */
export type MailTransport = "outbox" | "memory" | "smtp" | "none";

export interface Mailer {
  readonly transport: MailTransport;
  send(message: MailMessage): Promise<void>;
}
