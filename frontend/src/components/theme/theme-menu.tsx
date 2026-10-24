"use client";

import { Check, ChevronsUpDown, Monitor, Moon, Sun } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { useTheme } from "./theme-provider";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

type ThemeMenuProps = {
  /** `row`: fila a todo el ancho (menu lateral). `icon`: solo icono (headers). */
  variant?: "row" | "icon";
  /** Hacia donde se abre la lista. */
  placement?: "top" | "bottom";
  align?: "start" | "end";
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
};

/**
 * Desplegable de tema (claro, oscuro, sistema) con el patron de menu de WAI-ARIA:
 * flechas, Inicio/Fin, Enter/Espacio, Escape devuelve el foco y un clic fuera lo cierra.
 */
export function ThemeMenu({
  variant = "row",
  placement = "top",
  align = "start",
  className,
  triggerClassName,
  menuClassName,
}: ThemeMenuProps) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[2];
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) {
      return;
    }

    itemRefs.current[OPTIONS.findIndex((option) => option.value === theme)]?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, theme]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function select(value: ThemePreference) {
    setTheme(value);
    close();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = itemRefs.current.filter((item): item is HTMLButtonElement => item !== null);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (next: number) => items[(next + items.length) % items.length]?.focus();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      case "Escape":
        // No debe cerrar tambien el menu lateral movil que escucha Escape en el documento.
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", variant === "row" && "w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={variant === "icon" ? `Tema: ${current.label}` : undefined}
        title={variant === "icon" ? `Tema: ${current.label}` : undefined}
        className={cn(
          "flex items-center rounded-lg text-sm text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
          variant === "row" ? "w-full gap-2.5 px-2.5 py-2" : "size-9 justify-center",
          triggerClassName,
          open && "bg-hub-hover text-hub-text",
        )}
      >
        <CurrentIcon size={17} aria-hidden="true" />
        {variant === "row" && (
          <>
            <span>Tema</span>
            <span className="ml-auto flex items-center gap-1 text-xs">
              {current.label}
              <ChevronsUpDown size={14} aria-hidden="true" />
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Tema de color"
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute z-50 min-w-40 rounded-lg border border-hub-border bg-hub-bg p-1 shadow-lg",
            placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
            align === "start" ? "left-0" : "right-0",
            variant === "row" && "w-full",
            menuClassName,
          )}
        >
          {OPTIONS.map(({ value, label, icon: Icon }, index) => {
            const checked = theme === value;

            return (
              <button
                key={value}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={-1}
                onClick={() => select(value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition focus-visible:outline-none focus:bg-hub-hover",
                  checked ? "text-hub-text" : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                )}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
                {checked && <Check size={15} className="ml-auto text-hub-accent" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
