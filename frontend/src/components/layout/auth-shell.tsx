import Link from "next/link";
import { ArrowLeft, Cpu, Code2, ShieldCheck } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Auth3DScene } from "@/features/auth/components/auth-3d-scene";
import { getThemePreference } from "@/lib/theme-server";

type AuthShellProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
};

/**
 * Marco de las pantallas de acceso con el logotipo tridimensional oficial de AlfaCode:
 * - Escenario 3D PBR cinematográfico con pedestal holográfico y doble anillo giroscópico.
 * - Atmósfera cyber-space profunda con nebulosas de acento, retícula de ingeniería y viñeta.
 * - Presentación minimalista y limpia centrada en la identidad de AlfaCode.
 * - Bóveda de acceso frosted glass de grado institucional.
 */
export async function AuthShell({
  title,
  description,
  children,
  footer,
  badge = "Acceso Institucional",
  heroHeadline = "AlfaCode HUB",
  heroSubheadline = "Semillero de Investigación en Computación Avanzada · Universidad de La Guajira.",
}: AuthShellProps) {
  const theme = await getThemePreference();

  return (
    <ThemeProvider initialTheme={theme} className="public-site flex min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex-col justify-between">
      <div className="relative flex min-h-screen lg:h-screen lg:max-h-screen flex-col justify-between overflow-x-hidden lg:overflow-hidden bg-site-page text-hub-text selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-300">
        {/* Atmósfera Ambiental: Nebulosas en capas */}
        <div
          className="pointer-events-none absolute -top-48 -left-48 size-[650px] rounded-full bg-gradient-to-br from-cyan-500/15 via-sky-500/10 to-transparent blur-[160px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/3 -right-48 size-[700px] rounded-full bg-gradient-to-tl from-teal-500/15 via-cyan-500/10 to-transparent blur-[180px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-48 left-1/4 size-[550px] rounded-full bg-[#0382a1]/12 blur-[160px]"
          aria-hidden="true"
        />

        {/* Retícula de ingeniería */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.035)_1px,transparent_1px)] bg-[size:4rem_4rem]"
          aria-hidden="true"
        />
        {/* Micro-malla de puntos */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(103,232,249,0.06)_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        {/* Viñeta cinematográfica que enmarca los bordes adaptándose al fondo del tema */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--site-page)_95%)] opacity-80"
          aria-hidden="true"
        />

        {/* Cabecera superior con barra translúcida institucional */}
        <header className="relative z-20 mx-auto w-full max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8 lg:py-2.5">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 backdrop-blur-xl shadow-site-header transition-colors">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span className="flex size-9 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-950/70 p-1.5 shadow-[0_0_20px_rgba(3,130,161,0.3)] transition-transform duration-300 group-hover:scale-105">
                <AlfaCodeSymbol className="size-full" />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  Alfa<span className="text-hub-accent">Code</span>{" "}
                  <span className="font-mono text-xs font-semibold text-hub-muted">HUB</span>
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-950/50 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                Volver al portal
              </Link>
              <ThemeMenu variant="icon" placement="bottom" align="end" />
            </div>
          </div>
        </header>

        {/* Contenido principal: Grid cinematográfico de 2 columnas */}
        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-4 sm:px-6 lg:px-8 lg:py-2">
          <div className="grid w-full items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Columna Izquierda: Escenario 3D del Isotipo Oficial y Ecosistema de Investigación */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:col-span-7">
              {/* Escenario 3D interactivo con el logotipo oficial de AlfaCode */}
              <div className="relative w-full max-w-[460px] h-[240px] sm:h-[280px] lg:h-[330px] flex items-center justify-center">
                {/* Halo de resplandor ambiental y pedestal luminoso */}
                <div
                  className="pointer-events-none absolute inset-x-12 inset-y-8 rounded-full bg-gradient-to-tr from-cyan-500/18 via-teal-500/12 to-transparent blur-[100px]"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute bottom-4 w-3/4 h-16 rounded-full bg-cyan-400/20 blur-[50px]"
                  aria-hidden="true"
                />
                <Auth3DScene />
              </div>

              {/* Identidad y foco institucional minimalista */}
              <div className="space-y-2 max-w-xl w-full pt-1">
                <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-black tracking-tight text-white leading-tight">
                  {heroHeadline === "AlfaCode HUB" ? (
                    <>
                      Alfa<span className="text-hub-accent">Code</span>{" "}
                      <span className="font-mono text-cyan-400">HUB</span>
                    </>
                  ) : (
                    heroHeadline
                  )}
                </h1>

                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  {heroSubheadline}
                </p>

                {/* 3 Pills minimalistas con áreas de enfoque */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
                    <Cpu size={13} className="text-cyan-400" aria-hidden="true" />
                    Inteligencia Artificial
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
                    <Code2 size={13} className="text-cyan-400" aria-hidden="true" />
                    Ingeniería de Software
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
                    <ShieldCheck size={13} className="text-cyan-400" aria-hidden="true" />
                    Semillero Uniguajira
                  </span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Bóveda de Acceso Seguro (Tarjeta Frosted Glass) */}
            <div className="relative lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              {/* Resplandor ambiental exterior de la tarjeta */}
              <div
                className="pointer-events-none absolute -inset-1.5 rounded-[34px] bg-gradient-to-b from-cyan-400/20 via-teal-500/10 to-transparent opacity-70 blur-2xl"
                aria-hidden="true"
              />
              <section
                aria-labelledby="auth-title"
                className="relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-slate-950/85 p-6 sm:p-7 shadow-[var(--panel-shadow),0_0_35px_rgba(3,130,161,0.18)] backdrop-blur-3xl transition-all duration-300 hover:border-cyan-400/45"
              >
                {/* Línea superior con gradiente de luz cian */}
                <div
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                  aria-hidden="true"
                />

                {/* Insignia superior de la tarjeta */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 shadow-sm">
                    <span className="flex size-4 items-center justify-center">
                      <AlfaCodeSymbol className="size-full" />
                    </span>
                    <span>{badge}</span>
                  </div>
                </div>

                {/* Título y descripción de la tarjeta */}
                <div className="mt-3.5">
                  <h2
                    id="auth-title"
                    className="text-xl sm:text-2xl font-bold tracking-tight text-white text-balance"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-300">
                      {description}
                    </p>
                  )}
                </div>

                {/* Formulario (Children) */}
                <div className="mt-4">{children}</div>

                {/* Pie de la tarjeta */}
                {footer && (
                  <div className="mt-4 border-t border-white/10 pt-3 text-center text-xs sm:text-sm text-slate-400">
                    {footer}
                  </div>
                )}

                {/* Enlace de regreso */}
                <p className="mt-3.5 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-md text-xs text-slate-400 transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <ArrowLeft size={13} aria-hidden="true" />
                    Volver al sitio principal
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </main>

        {/* Pie de página institucional */}
        <footer className="relative z-20 mx-auto w-full max-w-7xl px-4 py-2.5 text-center text-xs text-slate-400 sm:px-6 sm:py-3 lg:px-8 border-t border-white/5">
          <p>
            © 2026 Semillero de Investigación AlfaCode · Universidad de La Guajira · Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </ThemeProvider>
  );
}
