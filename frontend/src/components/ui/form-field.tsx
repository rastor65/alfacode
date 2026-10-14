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
  "block w-full rounded-xl border border-hub-input-border bg-hub-input px-3.5 py-2 text-sm text-hub-text placeholder:text-slate-400 dark:placeholder:text-hub-muted shadow-2xs transition-colors duration-150 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

/**
 * Campo minimalista y elegante con etiqueta, ayuda y error asociados por `aria-describedby`.
 */
export function FormField({ label, hint, error, icon, type = "text", className, ...props }: FormFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-hub-soft">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400 dark:text-cyan-400/70"
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
            icon && "pl-10",
            isPassword && "pr-10",
            error ? "border-hub-field-error" : "hover:border-slate-400 dark:hover:border-white/20",
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
        <p id={`${id}-hint`} className="text-[11px] text-hub-muted">
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
};

export function TextAreaField({ label, hint, error, icon, className, rows = 3, ...props }: TextAreaFieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-hub-soft">
          {label}
        </label>
        {icon && <span className="text-slate-400 dark:text-cyan-400/60">{icon}</span>}
      </div>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          inputClassName,
          "resize-y min-h-[56px]",
          error ? "border-hub-field-error" : "hover:border-slate-400 dark:hover:border-white/20",
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[11px] text-hub-muted">
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
