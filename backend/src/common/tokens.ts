import { createHash, randomBytes } from "node:crypto";

/** Token aleatorio de 256 bits, seguro para URLs. */
export function generateSecureToken() {
  return randomBytes(32).toString("base64url");
}

/** Hash SHA-256 en hex: es lo unico que se persiste de cualquier token. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
