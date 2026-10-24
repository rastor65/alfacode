import type { MailTransport } from "../modules/mail/mailer";
import { type SmtpConfig, parseSmtpConfig } from "../modules/mail/smtp.config";
import { parseAllowedEmailDomains } from "./email-domain";
import { loadDatabaseEnv } from "../database/database.options";

export const SECURITY_CONFIG = Symbol("SECURITY_CONFIG");

export interface SecurityConfig {
  /** Origenes web autorizados para CORS y para operaciones mutables. */
  allowedOrigins: string[];
  sessionCookieName: string;
  csrfCookieName: string;
  /** `Secure=false` solo se permite con NODE_ENV=development (plan-desarrollo, seccion 2.3). */
  secureCookies: boolean;
  /**
   * Valor para `trust proxy` de Express; define de donde sale la IP usada por el rate limit.
   * Por defecto (fuera de produccion) `loopback`: solo se cree el X-Forwarded-For que llega
   * desde el servidor de Next.js local, que lo reemplaza por la IP real del cliente (DEC-006).
   */
  trustProxy: boolean | number | string;
  /** Intervalo de limpieza de sesiones vencidas; 0 la desactiva. */
  sessionCleanupIntervalMs: number;
  /** URL publica del frontend, base de los enlaces enviados por correo. */
  publicAppUrl: string;
  mailTransport: MailTransport;
  mailOutboxDir: string;
  /** Solo con `MAIL_TRANSPORT=smtp`. */
  smtp: SmtpConfig | null;
  /** Dominios de correo autorizados; por defecto solo `uniguajira.edu.co` (DEC-010). */
  allowedEmailDomains: string[];
}

const MAIL_TRANSPORTS: MailTransport[] = ["outbox", "memory", "smtp", "none"];

function parseMailTransport(value: string | undefined): MailTransport {
  if (value === undefined || value === "") {
    return process.env.NODE_ENV === "production" ? "none" : "outbox";
  }

  if (!MAIL_TRANSPORTS.includes(value as MailTransport)) {
    throw new Error(`MAIL_TRANSPORT invalido: "${value}" (permitidos: ${MAIL_TRANSPORTS.join(", ")})`);
  }

  return value as MailTransport;
}

function parseOrigins(value: string | undefined) {
  const list = (value ?? "http://localhost:3000,https://www.alfacode.app,https://alfacode.app")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (list.includes("https://www.alfacode.app") && !list.includes("https://alfacode.app")) {
    list.push("https://alfacode.app");
  } else if (list.includes("https://alfacode.app") && !list.includes("https://www.alfacode.app")) {
    list.push("https://www.alfacode.app");
  }

  return list;
}

function parseTrustProxy(value: string | undefined): boolean | number | string {
  if (value === undefined || value === "") {
    return "loopback";
  }

  if (value === "true" || value === "false") {
    return value === "true";
  }

  return /^\d+$/.test(value) ? Number(value) : value;
}

/**
 * Errores de configuracion que impiden arrancar en produccion. En produccion no se aceptan
 * valores por defecto pensados para desarrollo (DEC-006).
 */
export function productionConfigErrors(env: NodeJS.ProcessEnv = process.env) {
  const errors: string[] = [];

  if (!env.TRUST_PROXY) {
    errors.push(
      "TRUST_PROXY debe definirse: numero de proxies inversos de confianza que agregan X-Forwarded-For, o false si el backend recibe las conexiones directamente",
    );
  }

  if (!env.CORS_ORIGINS) {
    errors.push("CORS_ORIGINS debe definirse con los origenes web publicos del HUB");
  } else if (parseOrigins(env.CORS_ORIGINS).some((origin) => !origin.startsWith("https://"))) {
    errors.push("CORS_ORIGINS solo admite origenes https:// en produccion");
  }

  if (!env.APP_PUBLIC_URL?.startsWith("https://")) {
    errors.push("APP_PUBLIC_URL debe definirse con la URL https:// publica del frontend");
  }

  // outbox y memory guardan enlaces con tokens fuera de un buzon: solo smtp (real) o none.
  if (env.MAIL_TRANSPORT && !["smtp", "none"].includes(env.MAIL_TRANSPORT)) {
    errors.push("MAIL_TRANSPORT solo admite smtp o none en produccion");
  }

  return errors;
}

export function loadSecurityConfig(): SecurityConfig {
  loadDatabaseEnv();

  if (process.env.NODE_ENV === "production") {
    const errors = productionConfigErrors();

    if (errors.length > 0) {
      throw new Error(`Configuracion de seguridad invalida para produccion:\n- ${errors.join("\n- ")}`);
    }
  }

  const cleanupInterval = Number(process.env.SESSION_CLEANUP_INTERVAL_MS ?? 60 * 60 * 1000);
  const mailTransport = parseMailTransport(process.env.MAIL_TRANSPORT);

  return {
    allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
    sessionCookieName: process.env.SESSION_COOKIE_NAME || "alfacode_session",
    csrfCookieName: process.env.CSRF_COOKIE_NAME || "alfacode_csrf",
    secureCookies: process.env.NODE_ENV !== "development",
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    sessionCleanupIntervalMs: Number.isFinite(cleanupInterval) && cleanupInterval > 0 ? cleanupInterval : 0,
    publicAppUrl: (process.env.APP_PUBLIC_URL || "http://localhost:3000").replace(/\/$/, ""),
    mailTransport,
    mailOutboxDir: process.env.MAIL_OUTBOX_DIR || "./data/outbox",
    smtp: mailTransport === "smtp" ? parseSmtpConfig(process.env) : null,
    allowedEmailDomains: parseAllowedEmailDomains(process.env.ALLOWED_EMAIL_DOMAINS),
  };
}
