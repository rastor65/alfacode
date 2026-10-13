import Link from "next/link";
import { ArrowLeft, Cpu, Code2, ShieldCheck, Terminal } from "lucide-react";

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
 * - Jerarquía tipográfica display con tarjetas de pilares de investigación y consola de telemetría.
 * - Bóveda de acceso frosted glass de grado institucional con canal cifrado TLS 1.3.
 */
export async function AuthShell({
  title,
  description,
  children,
  footer,
  badge = "Terminal de Acceso Seguro",
  heroHeadline = "Arquitectura de Software, Inteligencia Artificial & Rigor Científico",
  heroSubheadline = "Plataforma central del Semillero de Investigación AlfaCode para la gestión de proyectos de investigación, repositorios de código y producción científica en la Universidad de La Guajira.",
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
            "--hub-panel": "rgba(8, 17, 28, 0.85)",
            "--hub-panel-border": "rgba(103, 232, 249, 0.25)",
            "--hub-text": "#f8fafc",
            "--hub-text-soft": "#cbd5e1",
            "--hub-muted": "#94a3b8",
            "--hub-accent": "#67e8f9",
            "--hub-input": "rgba(4, 13, 22, 0.92)",
            "--hub-input-border": "rgba(255, 255, 255, 0.16)",
          } as React.CSSProperties
        }
      >
        {/* Atmósfera Ambiental: Nebulosas en capas profundas */}
        <div
          className="pointer-events-none absolute -top-48 -left-48 size-[650px] rounded-full bg-gradient-to-br from-cyan-600/18 via-sky-700/10 to-transparent blur-[160px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/3 -right-48 size-[700px] rounded-full bg-gradient-to-tl from-teal-500/16 via-cyan-900/12 to-transparent blur-[180px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-48 left-1/4 size-[550px] rounded-full bg-[#0382a1]/15 blur-[160px]"
          aria-hidden="true"
        />

        {/* Retícula de ingeniería cibernética */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.035)_1px,transparent_1px)] bg-[size:4rem_4rem]"
          aria-hidden="true"
        />
        {/* Micro-malla de puntos */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(103,232,249,0.05)_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        {/* Viñeta cinematográfica que enmarca los bordes */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#030712_98%)]"
          aria-hidden="true"
        />

        {/* Cabecera superior con barra translúcida institucional */}
        <header className="relative z-20 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-2.5 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span className="flex size-9 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-950/70 p-1.5 shadow-[0_0_20px_rgba(3,130,161,0.45)] transition-transform duration-300 group-hover:scale-105">
                <AlfaCodeSymbol className="size-full" />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  Alfa<span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-cyan-400 bg-clip-text text-transparent">Code</span>{" "}
                  <span className="font-mono text-xs font-semibold text-cyan-300/90">HUB</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-950/50 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                  Lab v2.4
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
        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Columna Izquierda: Escenario 3D del Isotipo Oficial y Ecosistema de Investigación */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:col-span-7">
              {/* Escenario 3D interactivo con el logotipo oficial de AlfaCode */}
              <div className="relative w-full max-w-[540px] h-[320px] sm:h-[400px] lg:h-[460px] flex items-center justify-center">
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

              {/* Insignia y textos institucionales de alto impacto */}
              <div className="space-y-4 max-w-2xl w-full">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-mono text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Nodo Uniguajira</span>
                  <span className="text-cyan-400/40">/</span>
                  <span className="text-slate-300 font-mono text-[11px]">En Línea</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-[1.15] text-balance">
                  {heroHeadline}
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-xl">
                  {heroSubheadline}
                </p>

                {/* 3 Pilares del Semillero en Tarjetas Cibernéticas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 w-full text-left">
                  <div className="group rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 backdrop-blur-md transition-all hover:border-cyan-400/45 hover:bg-slate-900/80 hover:shadow-[0_0_25px_rgba(3,130,161,0.25)]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/70 text-cyan-300">
                        <Cpu size={14} />
                      </span>
                      <span className="text-xs font-bold text-white tracking-wide">IA & Computación</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                      Modelos generativos, agentes y visión aplicados.
                    </p>
                  </div>

                  <div className="group rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 backdrop-blur-md transition-all hover:border-cyan-400/45 hover:bg-slate-900/80 hover:shadow-[0_0_25px_rgba(3,130,161,0.25)]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/70 text-cyan-300">
                        <ShieldCheck size={14} />
                      </span>
                      <span className="text-xs font-bold text-white tracking-wide">Control RBAC</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                      Acceso institucional verificado @uniguajira.edu.co.
                    </p>
                  </div>

                  <div className="group rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 backdrop-blur-md transition-all hover:border-cyan-400/45 hover:bg-slate-900/80 hover:shadow-[0_0_25px_rgba(3,130,161,0.25)]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/70 text-cyan-300">
                        <Code2 size={14} />
                      </span>
                      <span className="text-xs font-bold text-white tracking-wide">I+D de Software</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                      Arquitectura moderna y trazabilidad científica.
                    </p>
                  </div>
                </div>

                {/* Barra de telemetría de ingeniería */}
                <div className="rounded-xl border border-cyan-500/20 bg-slate-950/70 px-4 py-2.5 font-mono text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Terminal size={13} className="text-cyan-400 shrink-0" />
                    <span className="text-cyan-300 font-semibold tracking-wider text-[10px]">TELEMETRÍA EN TIEMPO REAL</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                    <span>REGISTRO: <span className="text-emerald-400 font-semibold">ACTIVO</span></span>
                    <span>IDENTIDAD: <span className="text-cyan-300 font-semibold">ALFACODE_RESEARCH_CORE</span></span>
                    <span>CIFRADO: <span className="text-cyan-300 font-semibold">AES-256-GCM / TLS 1.3</span></span>
                    <span>ESTADO: <span className="text-emerald-400 font-semibold">CANAL SEGURO ESTABLECIDO</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Bóveda de Acceso Seguro (Tarjeta Frosted Glass) */}
            <div className="relative lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              {/* Resplandor ambiental exterior de la tarjeta */}
              <div
                className="pointer-events-none absolute -inset-1.5 rounded-[34px] bg-gradient-to-b from-cyan-400/25 via-teal-500/10 to-transparent opacity-75 blur-2xl"
                aria-hidden="true"
              />
              <section
                aria-labelledby="auth-title"
                className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-slate-950/85 p-7 sm:p-9 shadow-[0_0_80px_rgba(0,0,0,0.85),0_0_40px_rgba(3,130,161,0.25)] backdrop-blur-3xl transition-all duration-300 hover:border-cyan-400/50"
              >
                {/* Línea superior con gradiente de luz cian */}
                <div
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                  aria-hidden="true"
                />

                {/* Insignia superior de la tarjeta */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <span className="flex size-4 items-center justify-center">
                      <AlfaCodeSymbol className="size-full" />
                    </span>
                    <span>{badge}</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300/80 tracking-wider">SSL · SEEDBED</span>
                </div>

                {/* Título y descripción de la tarjeta */}
                <div className="mt-5">
                  <h2
                    id="auth-title"
                    className="text-2xl sm:text-[26px] font-bold tracking-tight text-white text-balance"
                  >
                    {title}
                  </h2>
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
                <p className="mt-5 text-center">
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
        <footer className="relative z-20 mx-auto w-full max-w-7xl px-4 py-5 text-center text-xs text-slate-400 sm:px-6 lg:px-8 border-t border-white/5">
          <p>
            © 2026 Semillero de Investigación AlfaCode · Universidad de La Guajira · Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </ThemeProvider>
  );
}
