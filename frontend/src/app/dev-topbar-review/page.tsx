import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";
import type { SessionUser } from "@/lib/auth/roles";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ theme?: string; role?: string; long?: string }> }) {
  const params = await searchParams;
  const user: SessionUser = {
    id: "topbar-review-synthetic", fullName: params.long ? "Alejandría del Carmen de los Ángeles Villanueva Montenegro" : "Daniela Rivera",
    email: "review@example.invalid", accountStatus: "active", mustChangePassword: false,
    roles: params.role === "student" ? ["student"] : ["admin"],
  };
  return <ThemeProvider initialTheme={params.theme === "dark" ? "dark" : params.theme === "system" ? "system" : "light"}>
    <AppShell user={user}>
      <div className="mx-auto max-w-5xl space-y-7 py-3">
        <div><p className="text-sm text-hub-muted">Panel</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-hub-text">Hola, Daniela</h1><p className="mt-2 text-sm text-hub-muted">Este es tu espacio de trabajo en AlfaCode.</p></div>
        <section className="rounded-xl border border-hub-border bg-hub-panel p-6"><h2 className="text-base font-medium text-hub-text">Tu cuenta</h2><p className="mt-3 text-sm text-hub-muted">Vista de revisión con datos sintéticos, sin acceso a información real.</p></section>
      </div>
    </AppShell>
  </ThemeProvider>;
}
