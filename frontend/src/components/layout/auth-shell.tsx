import Link from "next/link";
import { ArrowLeft, Cpu, ShieldCheck, Sparkles } from "lucide-react";

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
 * Marco inmersivo de las pantallas de acceso con Three.js WebGL:
 * - Escena 3D reactiva al cursor con núcleo holográfico y constelación neuronal.
 * - Fondo espacial con gradientes radiales cian y malla cibernética.
 * - Distribución dividida en escritorio (vitrina científica a la izquierda + tarjeta de cristal a la derecha).
 * - Totalmente accesible (prefers-reduced-motion, ARIA y contraste de texto).
 */
export async function AuthShell({
  title,
  description,
  children,
  footer,
  badge = "Terminal de Acceso Seguro",
  heroHeadline = "Arquitectura de Software, Inteligencia Artificial & Rigor Científico",
  heroSubheadline = "Plataforma central del Semillero AlfaCode para la gestión de proyectos de investigación, repositorios de código y producción científica en la Universidad de La Guajira.",
}: AuthShellProps) {
  const theme = await getThemePreference();

  return (
    <ThemeProvider
      initialTheme={theme}
      className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-[#040810] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* 1. Fondo 3D interactivo WebGL (Three.js) */}
      <Auth3DScene />

      {/* 2. Capas atmosféricas de iluminación y rejilla cibernética */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full bg-cyan-600/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 size-[600px] rounded-full bg-[#0382a1]/20 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-cyan-400/10 blur-[160px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(103,232,249,0.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-75"
        aria-hidden="true"
      />

      {/* 3. Cabecera superior con marca y menú de tema */}
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

      {/* 4. Contenido central: Split Grid en desktop */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* 4.1. Columna izquierda: Vitrina científica y tecnológica (visible en lg+) */}
          <div className="hidden lg:col-span-7 lg:block space-y-6">
            {/* Insignia de estado del nodo */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/25 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>Nodo Uniguajira · En línea</span>
              <span className="text-cyan-500/60">/</span>
              <span className="text-slate-400">Auth TLS 1.3</span>
            </div>

            {/* Titular hero */}
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl leading-tight text-balance">
                {heroHeadline}
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-slate-300">
                {heroSubheadline}
              </p>
            </div>

            {/* Tarjetas de capacidades del semillero */}
            <div className="grid max-w-xl gap-3 sm:grid-cols-3 pt-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 backdrop-blur-md transition hover:border-cyan-400/30 hover:bg-slate-900/70">
                <div className="flex size-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 text-cyan-300">
                  <Sparkles size={14} />
                </div>
                <h3 className="mt-2 text-xs font-bold text-white">IA & Computación</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Modelos generativos, agentes y visión aplicados.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 backdrop-blur-md transition hover:border-cyan-400/30 hover:bg-slate-900/70">
                <div className="flex size-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 text-cyan-300">
                  <ShieldCheck size={14} />
                </div>
                <h3 className="mt-2 text-xs font-bold text-white">Control RBAC</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Acceso institucional verificado @uniguajira.edu.co.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 backdrop-blur-md transition hover:border-cyan-400/30 hover:bg-slate-900/70">
                <div className="flex size-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 text-cyan-300">
                  <Cpu size={14} />
                </div>
                <h3 className="mt-2 text-xs font-bold text-white">I+D de Software</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Arquitectura moderna y trazabilidad científica.
                </p>
              </div>
            </div>

            {/* Consola de telemetría */}
            <div className="max-w-xl rounded-xl border border-cyan-500/15 bg-black/40 p-3 font-mono text-[11px] text-cyan-400/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-[10px] text-slate-300 border-b border-cyan-500/10 pb-1.5 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  TELEMETRÍA EN TIEMPO REAL
                </span>
                <span>REGISTRO: ACTIVO</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-400">
                  &gt; IDENTIDAD: <span className="text-cyan-300">ALFACODE_RESEARCH_CORE</span>
                </p>
                <p className="text-slate-400">
                  &gt; CIFRADO: <span className="text-emerald-400">AES-256-GCM / TLS 1.3</span>
                </p>
                <p className="text-slate-400">
                  &gt; ESTADO: <span className="text-cyan-300">CANAL SEGURO ESTABLECIDO</span>
                </p>
              </div>
            </div>
          </div>

          {/* 4.2. Columna derecha: Tarjeta de Acceso con efecto Frosted Glass */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            <section
              aria-labelledby="auth-title"
              className="relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-slate-950/80 p-6 sm:p-8 md:p-9 shadow-[0_0_60px_rgba(0,0,0,0.7),0_0_30px_rgba(3,130,161,0.25)] backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40"
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

      {/* 5. Pie de página institucional */}
      <footer className="relative z-20 mx-auto w-full max-w-7xl px-4 py-4 text-center text-xs text-slate-300 sm:px-6 lg:px-8">
        <p>
          © 2026 Semillero de Investigación AlfaCode · Universidad de La Guajira · Todos los derechos reservados.
        </p>
      </footer>
    </ThemeProvider>
  );
}
