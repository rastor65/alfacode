"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { usePortalContainer } from "./portal-container";

/**
 * `Select` de shadcn/ui (sobre Radix), adaptado a los tokens de tema del HUB. Con `name`,
 * Radix agrega un `<select>` oculto, asi que funciona dentro de formularios (`FormData`).
 */
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-hub-input-border bg-hub-input px-3 py-2 text-left text-base text-hub-text transition hover:border-hub-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/70 disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-hub-muted sm:text-sm [&>span]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown size={16} className="shrink-0 text-hub-muted" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectScrollUpButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton className={cn("flex items-center justify-center py-1 text-hub-muted", className)} {...props}>
      <ChevronUp size={16} aria-hidden="true" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton className={cn("flex items-center justify-center py-1 text-hub-muted", className)} {...props}>
      <ChevronDown size={16} aria-hidden="true" />
    </SelectPrimitive.ScrollDownButton>
  );
}

function SelectContent({ className, children, position = "popper", ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  // Dentro de un modal, la lista se monta en el propio dialogo (ver `portal-container.tsx`).
  const container = usePortalContainer();

  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          "relative z-50 max-h-[min(var(--radix-select-content-available-height),20rem)] min-w-[8rem] overflow-hidden rounded-xl border border-hub-border bg-hub-bg text-hub-text shadow-lg",
          position === "popper" && "w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("px-2.5 py-1.5 text-xs font-medium text-hub-muted", className)} {...props} />;
}

function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-2.5 pr-8 text-sm text-hub-text outline-none focus:bg-hub-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={15} className="text-hub-accent" aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-hub-border", className)} {...props} />;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
