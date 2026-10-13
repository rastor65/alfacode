import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Logger } from "@nestjs/common";
import { createTransport } from "nodemailer";

import type { MailMessage, Mailer } from "./mailer";
import type { SmtpConfig } from "./smtp.config";

/** Transportador local de pruebas: un archivo .eml por correo, fuera de Git (`backend/data/`). */
export class OutboxMailer implements Mailer {
  readonly transport = "outbox" as const;
  private readonly logger = new Logger("OutboxMailer");

  constructor(private readonly directory: string) {}

  async send(message: MailMessage) {
    await mkdir(this.directory, { recursive: true });

    const file = join(this.directory, `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.eml`);
    const content = [
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      `Date: ${new Date().toUTCString()}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      message.text,
      "",
    ].join("\r\n");

    await writeFile(file, content, { encoding: "utf8", mode: 0o600 });
    // Solo se registra la ruta: el contenido incluye enlaces con tokens.
    this.logger.log(`Correo guardado en ${file}`);
  }
}

export class MemoryMailer implements Mailer {
  readonly transport = "memory" as const;
  readonly messages: MailMessage[] = [];
  /** Solo pruebas: si se define, el siguiente envio falla con este error. */
  failNext: Error | null = null;

  async send(message: MailMessage) {
    if (this.failNext) {
      const error = this.failNext;
      this.failNext = null;
      throw error;
    }

    this.messages.push(message);
  }
}

/**
 * Envio real por SMTP. Con Google: `smtp.gmail.com`, puerto 465 (TLS implicito) o 587
 * (STARTTLS obligatorio) y una contrasena de aplicacion; nunca se registra la contrasena.
 */
export class SmtpMailer implements Mailer {
  readonly transport = "smtp" as const;
  private readonly transporter;

  constructor(private readonly config: SmtpConfig) {
    const implicitTls = config.port === 465;

    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: implicitTls,
      // En 587 se exige STARTTLS: nunca se envian credenciales sin cifrar.
      requireTLS: !implicitTls,
      auth: { user: config.user, pass: config.password },
      tls: { minVersion: "TLSv1.2" },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async send(message: MailMessage) {
    await this.transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }

  /** Comprueba conexion y credenciales sin enviar nada. */
  async verify() {
    await this.transporter.verify();
  }
}

export class NoMailer implements Mailer {
  readonly transport = "none" as const;

  async send(): Promise<void> {
    throw new Error("No hay transporte de correo configurado (MAIL_TRANSPORT=none)");
  }
}
