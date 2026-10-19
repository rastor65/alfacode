import { ApiRequestError, NETWORK_ERROR_CODE } from "./errors";

/**
 * Cliente del navegador para la API. Las peticiones van al mismo origen (`/api/v1`), que el
 * servidor de Next.js reenvia al backend: la cookie de sesion `HttpOnly` viaja sola y el
 * navegador agrega `Origin`. En operaciones mutables se reenvia el token CSRF ligado a la
 * sesion, que el backend deja en una cookie legible.
 */
export const API_BASE_PATH = "/api/v1";
export const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || "alfacode_csrf";

const SAFE_METHODS = new Set(["GET", "HEAD"]);

export function readCookie(cookieHeader: string, name: string) {
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");

    if (separator !== -1 && part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return send<T>(path, options.method ?? "GET", options.body === undefined ? undefined : JSON.stringify(options.body), options.signal, true);
}

/**
 * Carga `multipart/form-data` (documentos). El navegador fija el `Content-Type` con su limite;
 * el CSRF y el manejo de errores son los mismos que en `apiRequest`.
 */
export async function apiUpload<T>(path: string, form: FormData, signal?: AbortSignal): Promise<T> {
  return send<T>(path, "POST", form, signal, false);
}

async function send<T>(
  path: string,
  method: NonNullable<RequestOptions["method"]>,
  body: string | FormData | undefined,
  signal: AbortSignal | undefined,
  json: boolean,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined && json) {
    headers["Content-Type"] = "application/json";
  }

  if (!SAFE_METHODS.has(method) && typeof document !== "undefined") {
    const csrfToken = readCookie(document.cookie, CSRF_COOKIE_NAME);

    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      method,
      headers,
      body,
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if ((error as { name?: string } | null)?.name === "AbortError") {
      throw error;
    }

    throw new ApiRequestError(0, NETWORK_ERROR_CODE, "No se pudo conectar con el servidor");
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const body = (data ?? {}) as { code?: unknown; message?: unknown; details?: unknown };

    throw new ApiRequestError(
      response.status,
      typeof body.code === "string" ? body.code : "HTTP_ERROR",
      typeof body.message === "string" ? body.message : `Error HTTP ${response.status}`,
      body.details ?? null,
    );
  }

  return data as T;
}
