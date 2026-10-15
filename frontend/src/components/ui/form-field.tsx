"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useId, useState } from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
};

const inputBaseClass =
  "block w-full h-11 rounded-xl border border-hub-input-border bg-hub-input px-3.5 text-sm text-hub-text placeholder:text-hub-muted shadow-xs transition-all duration-150 focus:outline-none focus:border-cyan-500 focus:bg-hub-input focus:ring-4 focus:ring-cyan-500/15";

/**
 * Campo minimalista y elegante con etiqueta, ayuda y error asociados por `aria-describedby`.
 */
export function FormField({ label, hint, error, icon, badge, type = "text", className, ...props }: FormFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-semibold text-hub-text">
            {label}
          </label>
          {badge && <div>{badge}</div>}
        </div>
      ) : badge ? (
        <div className="flex justify-end">{badge}</div>
      ) : null}
      <div className="relative group">
        {icon && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-hub-muted transition-colors group-focus-within:text-cyan-500"
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
            inputBaseClass,
            icon && "pl-9",
            isPassword && "pr-10",
            error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15" : "hover:border-cyan-500/40",
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-xl text-hub-muted transition hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={revealed}
          >
            {revealed ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[11px] text-hub-muted leading-tight">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-hub-field-error font-medium">
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
  icon?: React.ReactNode;
  badge?: React.ReactNode;
};

export function TextAreaField({ label, hint, error, icon, badge, className, rows = 3, ...props }: TextAreaFieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-hub-text">
          {label}
        </label>
        {badge ? <div>{badge}</div> : icon && <span className="text-hub-muted">{icon}</span>}
      </div>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "block w-full rounded-xl border border-hub-input-border bg-hub-input px-3.5 py-2.5 text-sm text-hub-text placeholder:text-hub-muted shadow-xs transition-all duration-150 focus:outline-none focus:border-cyan-500 focus:bg-hub-input focus:ring-4 focus:ring-cyan-500/15 resize-y min-h-[68px]",
          error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15" : "hover:border-cyan-500/40",
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[11px] text-hub-muted leading-tight">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-hub-field-error font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
