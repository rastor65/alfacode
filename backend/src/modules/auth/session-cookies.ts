import type { CookieOptions, Request, Response } from "express";

import type { SecurityConfig } from "../../common/security.config";

export const CSRF_HEADER = "x-csrf-token";

export function readCookie(request: Request, name: string) {
  const header = request.headers.cookie;

  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1 || part.slice(0, separator).trim() !== name) {
      continue;
    }

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function baseOptions(config: SecurityConfig): CookieOptions {
  return { secure: config.secureCookies, sameSite: "lax", path: "/" };
}

/**
 * La cookie de sesion es HttpOnly. La cookie CSRF es legible por el frontend, que debe
 * reenviar su valor en la cabecera `X-CSRF-Token` en cada operacion mutable.
 */
export function setSessionCookies(
  response: Response,
  config: SecurityConfig,
  tokens: { token: string; csrfToken: string; expiresAt: Date },
) {
  response.cookie(config.sessionCookieName, tokens.token, {
    ...baseOptions(config),
    httpOnly: true,
    expires: tokens.expiresAt,
  });
  response.cookie(config.csrfCookieName, tokens.csrfToken, {
    ...baseOptions(config),
    httpOnly: false,
    expires: tokens.expiresAt,
  });
}

export function clearSessionCookies(response: Response, config: SecurityConfig) {
  response.clearCookie(config.sessionCookieName, { ...baseOptions(config), httpOnly: true });
  response.clearCookie(config.csrfCookieName, { ...baseOptions(config), httpOnly: false });
}
