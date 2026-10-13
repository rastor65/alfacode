import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiRequestError } from "./errors";

const API_TARGET = process.env.API_PROXY_TARGET || "http://localhost:4000";
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "alfacode_session";

/**
 * Llamada al backend desde el servidor de Next.js en nombre de quien navega: reenvia su
 * cookie de sesion y su IP real (fijada por `server/client-ip.mjs`), para que la
 * autorizacion y los limites del backend se apliquen a esa persona y no al servidor.
 */
export async function serverFetch(path: string) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const requestHeaders: Record<string, string> = { Accept: "application/json" };

  if (token) {
    requestHeaders.Cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
  }

  const clientIp = (await headers()).get("x-forwarded-for");

  if (clientIp) {
    requestHeaders["X-Forwarded-For"] = clientIp;
  }

  return fetch(`${API_TARGET}/api/v1${path}`, { headers: requestHeaders, cache: "no-store" });
}

/**
 * Lectura para paginas protegidas: sin sesion lleva al login y con contrasena temporal a
 * cambiarla; cualquier otro error se lanza como `ApiRequestError` para que la pagina decida.
 */
export async function serverApi<T>(path: string, currentPath: string): Promise<T> {
  const response = await serverFetch(path);
  const body = (await response.json().catch(() => null)) as
    | (T & { code?: string; message?: string; details?: unknown })
    | null;

  if (response.status === 401) {
    redirect(`/ingresar?next=${encodeURIComponent(currentPath)}`);
  }

  if (!response.ok) {
    if (body?.code === "PASSWORD_CHANGE_REQUIRED") {
      redirect("/cambiar-contrasena");
    }

    throw new ApiRequestError(
      response.status,
      body?.code ?? "HTTP_ERROR",
      body?.message ?? `Error HTTP ${response.status}`,
      body?.details ?? null,
    );
  }

  return body as T;
}
