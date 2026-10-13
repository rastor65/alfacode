import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

import { type ButtonVariant, buttonClassName } from "./button-styles";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  /** Muestra un indicador y bloquea el boton mientras la accion esta en curso. */
  pending?: boolean;
  pendingLabel?: string;
};

export function Button({
  className,
  variant = "primary",
  pending = false,
  pendingLabel,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle size={16} className="mr-2 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
