import { cn } from "@/lib/utils";

/**
 * `neutral` y `ghost` siguen el tema del HUB (claro u oscuro); `secondary` es el estilo
 * del sitio publico (oscuro; en claro lo adapta la paleta de `.public-site`). `ghost` no tiene borde ni fondo: para acciones discretas en menus.
 */
export type ButtonVariant = "primary" | "secondary" | "neutral" | "ghost";

/** Estilos compartidos por `ButtonLink` y `Button`. */
export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg disabled:pointer-events-none disabled:opacity-60",
    variant === "primary" &&
      "bg-gradient-to-r from-[#3fa2ba] to-[#5ecce3] text-[#031015] shadow-[0_4px_20px_rgba(70,158,180,0.35)] hover:shadow-[0_6px_25px_rgba(70,158,180,0.5)] hover:brightness-105",
    variant === "secondary" &&
      "border border-cyan-400/25 bg-slate-900/60 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-cyan-400/50 hover:bg-slate-800/80 hover:text-white",
    variant === "neutral" &&
      "border border-hub-input-border bg-hub-panel text-hub-text hover:bg-hub-hover",
    variant === "ghost" &&
      "min-h-0 justify-start rounded-lg px-2.5 py-2 font-normal text-hub-muted hover:bg-hub-hover hover:text-hub-text active:scale-100",
    className,
  );
}
