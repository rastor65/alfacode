"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { type ThemePreference, themeCookie } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { TechThemeTransition } from "./tech-theme-transition";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  /** Preferencia leida de la cookie en el servidor. */
  initialTheme: ThemePreference;
  className?: string;
  children: React.ReactNode;
};

/**
 * Aplica el tema a las vistas del HUB con `data-theme` sobre `.hub-theme`. El modo `system`
 * lo resuelve CSS (`prefers-color-scheme`), por eso no hace falta JavaScript para detectarlo.
 * Integra la transición tecnológica de mosaico de píxeles y láser con curva de easing.
 */
export function ThemeProvider({ initialTheme, className, children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState(initialTheme);
  const [transitioning, setTransitioning] = useState(false);
  const [targetTheme, setTargetTheme] = useState<ThemePreference | null>(null);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      if (next === theme) return;

      const applyTheme = () => {
        // Actualizar directamente el atributo en el DOM para reacción instantánea (<1ms)
        if (typeof document !== "undefined") {
          const targets = document.querySelectorAll(".hub-theme, .public-site");
          targets.forEach((el) => el.setAttribute("data-theme", next));
          document.documentElement.setAttribute("data-theme", next);
        }
        setThemeState(next);
        document.cookie = themeCookie(next, window.location.protocol === "https:");
      };

      // Si el usuario prefiere movimiento reducido, alternar sin animación
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        applyTheme();
        return;
      }

      // Cambio inmediato y reactivo sin retraso artificial
      setTargetTheme(next);
      setTransitioning(true);
      applyTheme();

      // Concluir la animación tecnológica rápidamente (200ms) para cero lag
      const endTimer = setTimeout(() => {
        setTransitioning(false);
        setTargetTheme(null);
      }, 200);

      return () => {
        clearTimeout(endTimer);
      };
    },
    [theme]
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext value={value}>
      <div data-theme={theme} className={cn("hub-theme min-h-screen", className)}>
        {children}
      </div>
      <TechThemeTransition active={transitioning} toTheme={targetTheme} />
    </ThemeContext>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }

  return context;
}
