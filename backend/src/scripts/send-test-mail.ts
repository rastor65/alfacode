import { loadSecurityConfig } from "../common/security.config";
import { SmtpMailer } from "../modules/mail/mailers";

/**
 * Prueba funcional del correo real (F1-11): `npm run mail:test -- destinatario@uniguajira.edu.co`.
 * Comprueba conexion y credenciales SMTP y envia un correo de prueba. No muestra la contrasena.
 */
async function main() {
  const to = process.argv[2]?.trim();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new Error("Indica el destinatario: npm run mail:test -- destinatario@uniguajira.edu.co");
  }

  const config = loadSecurityConfig();

  if (config.mailTransport !== "smtp" || !config.smtp) {
    throw new Error(`MAIL_TRANSPORT es "${config.mailTransport}"; configura MAIL_TRANSPORT=smtp en backend/.env`);
  }

  const { host, port, user, from } = config.smtp;
  const mailer = new SmtpMailer(config.smtp);

  console.log(`Conectando a ${host}:${port} como ${user}...`);
  await mailer.verify();
  console.log("Conexion y credenciales correctas.");

  await mailer.send({
    to,
    subject: "AlfaCode HUB: correo de prueba",
    text: [
      "Este es un correo de prueba de AlfaCode HUB.",
      "",
      `Remitente configurado: ${from}`,
      `Enviado: ${new Date().toISOString()}`,
      "",
      "Si lo recibiste, el envio de correos funciona.",
    ].join("\n"),
  });
  console.log(`Correo de prueba enviado a ${to}. Revisa la bandeja de entrada (y la de spam).`);
}

void main().catch((error: unknown) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
