import { getThemePreference } from "@/lib/theme-server";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "./theme-provider";

type PublicThemeProviderProps = {
  className?: string;
  children: React.ReactNode;
};

/**
 * Tema del portafolio publico: misma cookie que el HUB y la clase `public-site`, que en claro
 * reasigna la paleta con la que se escribieron sus componentes (ver `globals.css`).
 */
export async function PublicThemeProvider({ className, children }: PublicThemeProviderProps) {
  return (
    <ThemeProvider initialTheme={await getThemePreference()} className={cn("public-site", className)}>
      {children}
    </ThemeProvider>
  );
}
