"use client";

import { createContext, useContext } from "react";

/**
 * Contenedor para los portales (listas de `Select`, menus). Dentro de un `<dialog>` modal
 * el contenido debe montarse en el propio dialogo: lo que se monte en `body` queda debajo
 * de la capa superior del navegador y ademas inerte.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer() {
  return useContext(PortalContainerContext) ?? undefined;
}
