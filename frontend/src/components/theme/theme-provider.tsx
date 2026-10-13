"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { type ThemePreference, themeCookie } from "@/lib/theme";
import { cn } from "@/lib/utils";

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
 */
export function ThemeProvider({ initialTheme, className, children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState(initialTheme);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    document.cookie = themeCookie(next, window.location.protocol === "https:");
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext value={value}>
      <div data-theme={theme} className={cn("hub-theme min-h-screen", className)}>
        {children}
      </div>
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
