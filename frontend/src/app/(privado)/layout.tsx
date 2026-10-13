import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getSessionUser } from "@/lib/auth/session";
import { getThemePreference } from "@/lib/theme-server";

/**
 * Layout de las vistas privadas (header, menu lateral y contenido). Solo obtiene el usuario
 * para mostrarlo: los layouts no se vuelven a renderizar al navegar, por eso cada pagina
 * verifica la sesion con `requireSessionUser`.
 */
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  // Sin sesion, la propia pagina redirige al login.
  if (!user) {
    return children;
  }

  return (
    <ThemeProvider initialTheme={await getThemePreference()}>
      <AppShell user={user}>{children}</AppShell>
    </ThemeProvider>
  );
}
