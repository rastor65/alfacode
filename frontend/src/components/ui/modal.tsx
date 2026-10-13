"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { PortalContainerContext } from "./portal-container";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: "md" | "lg";
};

/**
 * Modal sobre `<dialog>` nativo con `showModal()`: el navegador atrapa el foco, deja el fondo
 * inerte para lectores de pantalla, cierra con Escape y devuelve el foco a quien lo abrio.
 * El contenido solo se monta mientras esta abierto, asi cada apertura empieza limpia.
 */
export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // El propio dialogo es el contenedor de los portales de su contenido (p. ej. `Select`).
  const [container, setContainer] = useState<HTMLDialogElement | null>(null);
  // Ref estable: una funcion nueva en cada render haria que React la reinvoque siempre.
  const setDialog = useCallback((element: HTMLDialogElement | null) => {
    ref.current = element;
    setContainer(element);
  }, []);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={setDialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Escape cierra el dialogo nativo; se avisa al padre para mantener el estado sincronizado.
      onClose={onClose}
      // Un clic en el propio <dialog> (no en su contenido) es un clic en el fondo.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-visible rounded-2xl border border-hub-border bg-hub-bg p-0 text-hub-text shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-[2px]",
        size === "lg" ? "max-w-2xl" : "max-w-lg",
      )}
    >
      {open && (
        <PortalContainerContext value={container}>
          <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-hub-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight text-hub-text">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="mt-0.5 text-sm text-hub-muted">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              aria-label="Cerrar"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        </div>
        </PortalContainerContext>
      )}
    </dialog>
  );
}
