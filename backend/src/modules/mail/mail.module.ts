import { resolve } from "node:path";

import { Global, Inject, Injectable, Logger, Module, type OnApplicationBootstrap } from "@nestjs/common";

import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { MAILER, type Mailer } from "./mailer";
import { MemoryMailer, NoMailer, OutboxMailer, SmtpMailer } from "./mailers";

function createMailer(config: SecurityConfig): Mailer {
  switch (config.mailTransport) {
    case "outbox":
      return new OutboxMailer(resolve(process.cwd(), config.mailOutboxDir));
    case "memory":
      return new MemoryMailer();
    case "smtp":
      return new SmtpMailer(config.smtp!);
    case "none":
      return new NoMailer();
  }
}

/**
 * Con SMTP comprueba conexion y credenciales al arrancar y deja el resultado en el log.
 * No bloquea el arranque: un SMTP caido no debe impedir iniciar sesion.
 */
@Injectable()
class SmtpStartupCheck implements OnApplicationBootstrap {
  private readonly logger = new Logger("Mail");

  constructor(
    @Inject(MAILER)
    private readonly mailer: Mailer,
    @Inject(SECURITY_CONFIG)
    private readonly config: SecurityConfig,
  ) {}

  onApplicationBootstrap() {
    if (!(this.mailer instanceof SmtpMailer)) {
      return;
    }

    const { host, port, user } = this.config.smtp!;
    this.mailer
      .verify()
      .then(() => this.logger.log(`SMTP listo: ${user} via ${host}:${port}`))
      .catch((error: unknown) =>
        this.logger.error(
          `SMTP no disponible (${host}:${port}, ${user}): ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
  }
}

@Global()
@Module({
  providers: [{ provide: MAILER, useFactory: createMailer, inject: [SECURITY_CONFIG] }, SmtpStartupCheck],
  exports: [MAILER],
})
export class MailModule {}
