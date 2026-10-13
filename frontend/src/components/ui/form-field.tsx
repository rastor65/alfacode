"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useId, useState } from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
};

const inputClassName =
  "block w-full rounded-xl border bg-hub-input px-3.5 py-2.5 text-base text-hub-text placeholder:text-hub-muted transition focus:outline-none focus:ring-2 focus:ring-cyan-500/70 sm:text-sm";

/**
 * Campo con etiqueta, ayuda y error asociados por `aria-describedby`. Los campos de
 * contrasena incluyen un boton para mostrar u ocultar lo escrito.
 */
export function FormField({ label, hint, error, icon, type = "text", className, ...props }: FormFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-hub-soft">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-cyan-400/60"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            inputClassName,
            icon && "pl-11",
            isPassword && "pr-11",
            error ? "border-hub-field-error" : "border-hub-input-border hover:border-hub-muted",
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-hub-muted transition hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={revealed}
          >
            {revealed ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-hub-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-hub-field-error">
          {error}
        </p>
      )}
    </div>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<"textarea">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({ label, hint, error, className, rows = 4, ...props }: TextAreaFieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-hub-soft">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          inputClassName,
          "resize-y",
          error ? "border-hub-field-error" : "border-hub-input-border hover:border-hub-muted",
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-hub-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-hub-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
