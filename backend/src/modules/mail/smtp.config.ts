export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  /** Remitente visible, p. ej. `AlfaCode HUB <cuenta@uniguajira.edu.co>`. */
  from: string;
}

/** Google: smtp.gmail.com con TLS implicito en 465 (o STARTTLS en 587) y contrasena de aplicacion. */
export const GOOGLE_SMTP_DEFAULTS = { host: "smtp.gmail.com", port: 465 };

/**
 * Lee y valida la configuracion SMTP. Se llama solo con `MAIL_TRANSPORT=smtp`; cualquier dato
 * faltante impide arrancar, para no descubrir el error cuando alguien intente registrarse.
 */
export function parseSmtpConfig(env: NodeJS.ProcessEnv): SmtpConfig {
  const errors: string[] = [];
  const host = env.SMTP_HOST?.trim() || GOOGLE_SMTP_DEFAULTS.host;
  const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : GOOGLE_SMTP_DEFAULTS.port;
  const user = env.SMTP_USER?.trim() ?? "";
  // Google muestra la contrasena de aplicacion en grupos con espacios; no forman parte de ella.
  const password = (env.SMTP_PASSWORD ?? "").replace(/\s+/g, "");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push(`SMTP_PORT invalido: "${env.SMTP_PORT}"`);
  }

  if (!user) {
    errors.push("SMTP_USER es obligatorio (la cuenta que envia los correos)");
  }

  if (!password) {
    errors.push("SMTP_PASSWORD es obligatorio (en Google, una contrasena de aplicacion)");
  }

  if (errors.length > 0) {
    throw new Error(`Configuracion SMTP invalida:\n- ${errors.join("\n- ")}`);
  }

  return { host, port, user, password, from: env.MAIL_FROM?.trim() || `AlfaCode HUB <${user}>` };
}
