"use client";

import { useSyncExternalStore } from "react";
import type { ThemePreference } from "@/lib/theme";

type TechThemeTransitionProps = {
  active: boolean;
  toTheme: ThemePreference | null;
};

const emptySubscribe = () => () => {};

/**
 * Transición tecnológica ultra-optimizada con GPU (transform3d y opacity).
 * - Cero latencia y cero lag visual.
 * - Malla cibernética en una sola capa compuesta por aceleración gráfica.
 * - Barrido láser horizontal de alta velocidad (240ms).
 */
export function TechThemeTransition({ active, toTheme }: TechThemeTransitionProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted || !active) return null;

  const isGoingDark = toTheme === "dark";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Malla digital cibernética en una sola capa optimizada por hardware */}
      <div
        className="absolute inset-0 opacity-20 will-change-opacity"
        style={{
          backgroundImage: isGoingDark
            ? "linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)"
            : "linear-gradient(rgba(14, 116, 144, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 116, 144, 0.25) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          animation: "cyberGridPulse 0.24s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      />

      {/* 2. Haz de luz láser / Scanline tecnológico acelerado por GPU */}
      <div
        className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_24px_#22d3ee] will-change-transform"
        style={{
          animation: "scanlineSweepGpu 0.24s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      />

      {/* 3. Destello sutil de reconfiguración */}
      <div
        className={`absolute inset-0 will-change-opacity ${
          isGoingDark ? "bg-cyan-950/20" : "bg-cyan-100/25"
        }`}
        style={{
          animation: "cyberFlashGpu 0.24s ease-out both",
        }}
      />

      {/* 4. Indicador HUD central de reconfiguración */}
      <div
        className="absolute left-1/2 top-14 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-950/90 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.35)] backdrop-blur-xl"
        style={{
          animation: "hudPulseFast 0.24s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <span className="size-1.5 animate-ping rounded-full bg-cyan-400" />
        <span>{isGoingDark ? "MODO OSCURO" : "MODO CLARO"}</span>
      </div>
    </div>
  );
}
