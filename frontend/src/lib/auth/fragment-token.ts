"use client";

import { useSyncExternalStore } from "react";

/** Tokens emitidos por el backend: 32 bytes en base64url. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Extrae el token de un fragmento `#token=...`. Los enlaces de correo lo envian en el
 * fragmento porque el navegador nunca lo manda al servidor ni queda en sus logs.
 */
export function tokenFromHash(hash: string) {
  const token = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash).get("token");
  return token && TOKEN_PATTERN.test(token) ? token : null;
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * Token del fragmento de la URL actual. En el servidor no existe (`undefined`); en el
 * navegador es el token o `null` si falta o no es valido.
 */
export function useFragmentToken() {
  return useSyncExternalStore(
    subscribe,
    () => tokenFromHash(window.location.hash),
    () => undefined,
  );
}

/** Quita el token de la barra de direcciones (y del historial) una vez usado. */
export function clearFragment() {
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
}
