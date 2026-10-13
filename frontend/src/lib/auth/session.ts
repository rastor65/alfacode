import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { CHANGE_PASSWORD_PATH } from "./redirects";
import type { SessionUser } from "./roles";

const API_TARGET = process.env.API_PROXY_TARGET || "http://localhost:4000";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "alfacode_session";

/**
 * Capa de acceso a datos de la sesion. Valida la cookie contra `GET /auth/me` en cada
 * renderizado (memoizado por peticion con `cache`): el backend es la fuente de verdad y
 * revisa sesion, expiracion y estado actual de la cuenta. Esto solo decide que mostrar;
 * la autorizacion efectiva ocurre en el backend en cada llamada a la API.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
  };
  // IP real del cliente, fijada por el servidor personalizado (server/client-ip.mjs), para
  // que los limites del backend no traten a todos los usuarios como el servidor de Next.js.
  const clientIp = (await headers()).get("x-forwarded-for");

  if (clientIp) {
    requestHeaders["X-Forwarded-For"] = clientIp;
  }

  const response = await fetch(`${API_TARGET}/api/v1/auth/me`, { headers: requestHeaders, cache: "no-store" });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`No se pudo validar la sesion (HTTP ${response.status})`);
  }

  return (await response.json()) as SessionUser;
});

/**
 * Para paginas protegidas: devuelve el usuario o redirige al login conservando el destino.
 * Con contrasena temporal redirige a cambiarla (el backend tambien bloquea la API).
 */
export async function requireSessionUser(currentPath: string, options: { allowPendingPasswordChange?: boolean } = {}) {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/ingresar?next=${encodeURIComponent(currentPath)}`);
  }

  if (user.mustChangePassword && !options.allowPendingPasswordChange) {
    redirect(CHANGE_PASSWORD_PATH);
  }

  return user;
}
