import { randomInt } from "node:crypto";

/** Sin caracteres que se confunden al leerlos o copiarlos a mano (0/O, 1/l/I). */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** Vigencia de una contrasena temporal antes de usarse por primera vez (DEC-016). */
export const TEMPORARY_PASSWORD_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * Contrasena temporal de 16 caracteres aleatorios (aprox. 93 bits) en grupos de 4:
 * `abcd-EFGH-jk23-mnpq`. Cumple la politica de 12 a 128 caracteres.
 */
export function generateTemporaryPassword() {
  const characters = Array.from({ length: 16 }, () => ALPHABET[randomInt(ALPHABET.length)]);
  return [0, 4, 8, 12].map((start) => characters.slice(start, start + 4).join("")).join("-");
}
