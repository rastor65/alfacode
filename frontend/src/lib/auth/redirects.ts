export const DEFAULT_AFTER_LOGIN = "/hub";

/** Pantalla obligatoria mientras la contrasena sea temporal (DEC-016). */
export const CHANGE_PASSWORD_PATH = "/cambiar-contrasena";

/** Rutas del flujo de acceso a las que no tiene sentido volver despues de iniciar sesion. */
const AUTH_ROUTES = ["/ingresar", "/registro", CHANGE_PASSWORD_PATH];

/**
 * Valida el destino posterior al login (`?next=`). Solo se aceptan rutas internas absolutas:
 * nada de `//dominio`, `/\dominio`, esquemas (`https:`, `javascript:`) ni caracteres de control,
 * para que el enlace no pueda usarse como redireccion abierta.
 */
export function safeNextPath(value: string | string[] | null | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.startsWith("/\\") ||
    candidate.length > 512 ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return DEFAULT_AFTER_LOGIN;
  }

  try {
    // Una ruta valida se resuelve dentro del mismo origen ficticio.
    const url = new URL(candidate, "http://alfacode.invalid");

    if (url.origin !== "http://alfacode.invalid" || AUTH_ROUTES.includes(url.pathname)) {
      return DEFAULT_AFTER_LOGIN;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AFTER_LOGIN;
  }
}
