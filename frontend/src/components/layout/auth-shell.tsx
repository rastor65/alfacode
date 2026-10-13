import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
 * - El logotipo 3D se ubica en su propio escenario dedicado en la columna izquierda (sin colisiones).
 * - Fondo espacial profundo (#030712) con iluminación de acento cian controlada.
 * - Forzado a estética oscura de alta fidelidad para asegurar contraste y visibilidad perfecta.
 * - Tarjeta de acceso frosted glass con borde cian reactivo y máxima legibilidad.
 */
export async function AuthShell({
  title,
  description,
  children,
  footer,
  badge = "Terminal de Acceso",
  heroHeadline = "AlfaCode HUB",
  heroSubheadline = "Plataforma central del Semillero de Investigación para la gestión de proyectos de software, modelos de inteligencia artificial y producción científica en la Universidad de La Guajira.",
}: AuthShellProps) {
  const theme = await getThemePreference();

  return (
    <ThemeProvider initialTheme={theme}>
      <div
        className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-[#030712] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200"
        style={
          {
            backgroundColor: "#030712",
            color: "#f8fafc",
            "--hub-bg": "#030712",
            "--hub-panel": "rgba(10, 20, 32, 0.85)",
            "--hub-panel-border": "rgba(103, 232, 249, 0.2)",
            "--hub-text": "#f8fafc",
            "--hub-text-soft": "#cbd5e1",
            "--hub-muted": "#94a3b8",
            "--hub-accent": "#67e8f9",
            "--hub-input": "rgba(6, 17, 26, 0.9)",
            "--hub-input-border": "rgba(255, 255, 255, 0.15)",
          } as React.CSSProperties
        }
      >
      {/* Luces ambientales suaves de fondo */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full bg-cyan-600/12 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 size-[600px] rounded-full bg-[#0382a1]/15 blur-[150px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(103,232,249,0.04)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden="true"
      />

      {/* Cabecera superior con marca y menú de tema */}
      <header className="relative z-20 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span className="flex size-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/60 p-1.5 shadow-[0_0_15px_rgba(3,130,161,0.35)] transition-transform duration-300 group-hover:scale-105">
              <AlfaCodeSymbol className="size-full" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                Alfa<span className="bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">Code</span>{" "}
                <span className="font-mono text-xs font-semibold text-cyan-300/80">HUB</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                Lab v2.4
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-950/40 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              Volver al portal
            </Link>
            <ThemeMenu variant="icon" placement="bottom" align="end" />
          </div>
        </div>
      </header>

      {/* Contenido principal: Grid de 2 columnas sin solapamientos */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-12 lg:gap-14">
          {/* Columna Izquierda: Escenario del Logotipo 3D Oficial de AlfaCode e identidad */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:col-span-7">
            {/* Escenario 3D interactivo con el logotipo oficial de AlfaCode */}
            <div className="relative w-full max-w-[480px] h-[280px] sm:h-[340px] lg:h-[390px] flex items-center justify-center">
              {/* Halo de resplandor ambiental detrás del logotipo 3D */}
              <div
                className="pointer-events-none absolute inset-x-8 inset-y-10 rounded-full bg-cyan-500/12 blur-[90px]"
                aria-hidden="true"
              />
              <Auth3DScene />
            </div>

            {/* Insignia y textos institucionales */}
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Semillero de Investigación · Universidad de La Guajira</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {heroHeadline}
              </h2>

              <p className="text-sm sm:text-base leading-relaxed text-slate-300">
                {heroSubheadline}
              </p>

              {/* Indicadores clave */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-slate-300">
                  ⚡ 12+ Proyectos Activos
                </span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-slate-300">
                  🔬 Producción Científica
                </span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-slate-300">
                  🛡️ Red Institucional
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Frosted Glass de Ingreso */}
          <div className="relative lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            {/* Halo sutil detrás de la tarjeta */}
            <div
              className="pointer-events-none absolute -inset-1 rounded-[32px] bg-gradient-to-b from-cyan-500/15 via-transparent to-transparent opacity-60 blur-xl"
              aria-hidden="true"
            />
            <section
              aria-labelledby="auth-title"
              className="relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-slate-950/85 p-6 sm:p-8 md:p-9 shadow-[0_0_60px_rgba(0,0,0,0.7),0_0_30px_rgba(3,130,161,0.25)] backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40"
            >
              {/* Línea superior con gradiente cian */}
              <div
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                aria-hidden="true"
              />

              {/* Insignia de la tarjeta */}
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/50 px-3 py-1 text-xs font-medium text-cyan-300">
                  <span className="flex size-4 items-center justify-center">
                    <AlfaCodeSymbol className="size-full" />
                  </span>
                  <span>{badge}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-300">SSL · SEEDBED</span>
              </div>

              {/* Título y descripción */}
              <div className="mt-4">
                <h1
                  id="auth-title"
                  className="text-2xl font-bold tracking-tight text-white text-balance"
                >
                  {title}
                </h1>
                {description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {description}
                  </p>
                )}
              </div>

              {/* Formulario (Children) */}
              <div className="mt-6">{children}</div>

              {/* Pie de la tarjeta */}
              {footer && (
                <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-slate-400">
                  {footer}
                </div>
              )}

              {/* Enlace de regreso */}
              <p className="mt-4 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded text-xs text-slate-400 transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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
      <footer className="relative z-20 mx-auto w-full max-w-7xl px-4 py-4 text-center text-xs text-slate-300 sm:px-6 lg:px-8">
        <p>
          © 2026 Semillero de Investigación AlfaCode · Universidad de La Guajira · Todos los derechos reservados.
        </p>
      </footer>
      </div>
    </ThemeProvider>
  );
}
