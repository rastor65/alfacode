import { isIP } from "node:net";

/** Cabeceras de origen del cliente que un navegador o atacante puede inventar. */
const SPOOFABLE_HEADERS = ["x-forwarded-for", "x-real-ip", "forwarded"];

function normalizeIp(value) {
  const ip = value?.trim();

  if (!ip) {
    return undefined;
  }

  // "::ffff:203.0.113.5" es una IPv4 vista desde un socket IPv6.
  const unmapped = ip.toLowerCase().startsWith("::ffff:") && isIP(ip.slice(7)) === 4 ? ip.slice(7) : ip;

  return isIP(unmapped) ? unmapped : undefined;
}

export function parseTrustedHops(value) {
  if (value === undefined || value === "") {
    return 0;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`FRONTEND_TRUSTED_PROXY_HOPS debe ser un entero >= 0 (recibido: "${value}")`);
  }

  return Number(value);
}

/**
 * Determina la IP real del cliente.
 *
 * - `trustedHops = 0`: Next.js recibe las conexiones directamente; solo cuenta el socket y
 *   cualquier X-Forwarded-For enviado por el cliente se descarta.
 * - `trustedHops = N`: hay N proxies inversos de confianza delante. Cada uno agrega a
 *   X-Forwarded-For la IP de quien lo llamo, asi que el cliente es la N-esima entrada desde
 *   la derecha; lo que haya a su izquierda lo pudo inventar el cliente y se ignora.
 */
export function resolveClientIp({ remoteAddress, forwardedFor, trustedHops }) {
  const socketIp = normalizeIp(remoteAddress);

  if (trustedHops > 0) {
    const header = Array.isArray(forwardedFor) ? forwardedFor.join(",") : (forwardedFor ?? "");
    const entries = header.split(",").map((entry) => entry.trim()).filter(Boolean);
    const candidate = entries.length >= trustedHops ? normalizeIp(entries[entries.length - trustedHops]) : undefined;

    if (candidate) {
      return candidate;
    }
  }

  return socketIp;
}

/**
 * Reemplaza las cabeceras de origen por una sola X-Forwarded-For con la IP real del cliente,
 * antes de que Next.js reenvie la peticion al backend mediante el rewrite de /api/v1.
 */
export function applyClientIpHeaders(request, trustedHops) {
  const clientIp = resolveClientIp({
    remoteAddress: request.socket?.remoteAddress,
    forwardedFor: request.headers["x-forwarded-for"],
    trustedHops,
  });

  for (const header of SPOOFABLE_HEADERS) {
    delete request.headers[header];
  }

  if (clientIp) {
    request.headers["x-forwarded-for"] = clientIp;
  }

  return clientIp;
}
