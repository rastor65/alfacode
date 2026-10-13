import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SESSION_COOKIE_NAME, serverFetch } from "../api/server";
import { CHANGE_PASSWORD_PATH } from "./redirects";
import type { SessionUser } from "./roles";

/**
 * Capa de acceso a datos de la sesion. Valida la cookie contra `GET /auth/me` en cada
 * renderizado (memoizado por peticion con `cache`): el backend es la fuente de verdad y
 * revisa sesion, expiracion y estado actual de la cuenta. Esto solo decide que mostrar;
 * la autorizacion efectiva ocurre en el backend en cada llamada a la API.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!(await cookies()).get(SESSION_COOKIE_NAME)?.value) {
    return null;
  }

  const response = await serverFetch("/auth/me");

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
