import { ApiError } from "./api-error";

/** Dominio institucional: los unicos correos autorizados en AlfaCode HUB (DEC-010). */
export const DEFAULT_ALLOWED_EMAIL_DOMAINS = ["uniguajira.edu.co"];

const DOMAIN_PATTERN = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function parseAllowedEmailDomains(value: string | undefined) {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_ALLOWED_EMAIL_DOMAINS;
  }

  const domains = value
    .split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

  const invalid = domains.filter((domain) => !DOMAIN_PATTERN.test(domain));

  if (domains.length === 0 || invalid.length > 0) {
    throw new Error(`ALLOWED_EMAIL_DOMAINS invalido: "${value}"`);
  }

  return domains;
}

/**
 * Compara exactamente el dominio (lo que sigue a la ultima `@`). No admite subdominios
 * (`x@sub.uniguajira.edu.co`) ni dominios que solo lo contienen (`x@uniguajira.edu.co.evil.com`).
 */
export function isAllowedEmail(email: string, allowedDomains: readonly string[]) {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");

  return at > 0 && allowedDomains.includes(normalized.slice(at + 1));
}

export function assertAllowedEmail(email: string, allowedDomains: readonly string[]) {
  if (!isAllowedEmail(email, allowedDomains)) {
    throw new ApiError(
      400,
      "EMAIL_DOMAIN_NOT_ALLOWED",
      `Solo se admiten correos institucionales (${allowedDomains.map((domain) => `@${domain}`).join(", ")})`,
    );
  }
}
