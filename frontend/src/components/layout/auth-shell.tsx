import Link from "next/link";
import { ArrowLeft, Cpu, Code2, ShieldCheck } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { AuthHeader } from "@/components/layout/auth-header";
import { PublicThemeProvider } from "@/components/theme/public-theme-provider";
import { Auth3DScene } from "@/features/auth/components/auth-3d-scene";
import { TechInteractiveBackground } from "@/features/home/components/tech-interactive-background";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  wideCard?: boolean;
  layout?: "split" | "centered";
};

/**
 * Shell unificado para las pantallas de acceso y postulación institucional:
 * - Utiliza exactamente el mismo Navbar flotante (`PublicHeader`) de la Landing Page.
 * - Fondo reactivo interactivo de micro-puntos e interpolación elástica (`TechInteractiveBackground`).
 * - Transición de tema unificada con `PublicThemeProvider`.
 * - Bóveda de acceso con cristal esmerilado (frosted glass) con tokens del portafolio público.
 * - Soporte para layout "split" (2 columnas con isotipo 3D PBR WebGL) y "centered" (flujo de registro).
 */
export async function AuthShell({
  title,
  description,
  children,
  footer,
  badge = "Acceso Institucional",
  heroHeadline = "AlfaCode HUB",
  heroSubheadline = "Semillero de Investigación en Ingeniería de Sistemas y Computación · Universidad de La Guajira.",
  wideCard = false,
  layout = "split",
}: AuthShellProps) {
  return (
    <PublicThemeProvider className="relative flex min-h-dvh flex-col justify-between overflow-x-hidden bg-site-bg text-white selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-300">
      {/* Fondo interactivo de micro-puntos y cruces técnicas reactivo al cursor */}
      <TechInteractiveBackground />

      {/* Navbar limpia exclusiva para autenticación (Home, Ingresar <-> Registro, Tema) */}
      <AuthHeader />

      {/* Máscara de difuminado y gradiente detrás del navbar al hacer scroll */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 sm:h-28 backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] bg-gradient-to-b from-site-bg/95 via-site-bg/60 to-transparent"
        aria-hidden="true"
      />

      {/* Contenido principal según layout */}
      {layout === "centered" ? (
        <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-3 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16 lg:px-8 lg:pt-32">
          {/* Cabecera del flujo */}
          <div className="mb-5 sm:mb-7 text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md">
              <span className="flex size-3.5 items-center justify-center">
                <AlfaCodeSymbol className="size-full" />
              </span>
              <span>{badge}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-balance">
              {title}
            </h1>

            {description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                {description}
              </p>
            )}
          </div>

          {/* Tarjeta Centrada Bóveda de Grado Institucional */}
          <div className="relative w-full max-w-2xl sm:max-w-3xl">
            <div
              className="pointer-events-none absolute -inset-2 rounded-[36px] bg-gradient-to-b from-cyan-500/15 via-transparent to-transparent opacity-30 dark:opacity-50 blur-2xl"
              aria-hidden="true"
            />
            <section
              aria-labelledby="auth-title"
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-cyan-400/25 bg-slate-950/85 p-5 sm:p-7 lg:p-9 shadow-xl dark:shadow-[var(--panel-shadow),0_0_25px_rgba(3,130,161,0.12)] backdrop-blur-3xl transition-all duration-300 hover:border-cyan-400/40"
            >
              {/* Línea superior con gradiente de luz cian */}
              <div
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                aria-hidden="true"
              />

              {/* Formulario */}
              <div>{children}</div>

              {/* Pie de la tarjeta */}
              {footer && (
                <div className="mt-5 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
                  {footer}
                </div>
              )}

              {/* Enlace de regreso */}
              <p className="mt-3 text-center">
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
        </main>
      ) : (
        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16 lg:px-8 lg:pt-32">
          <div className="grid w-full min-w-0 max-w-full items-center gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            {/* Columna Izquierda: Escenario 3D del Isotipo Oficial y Ecosistema de Investigación */}
            <div className={cn("flex w-full min-w-0 max-w-full flex-col items-center lg:items-start text-center lg:text-left", wideCard ? "lg:col-span-5" : "lg:col-span-7")}>
              {/* Escenario 3D interactivo con el logotipo oficial de AlfaCode */}
              <div className={cn(
                "relative w-full flex items-center justify-center min-w-0 mx-auto",
                wideCard
                  ? "max-w-[440px] h-[190px] sm:h-[240px] lg:h-[260px] xl:h-[310px]"
                  : "max-w-[520px] h-[210px] sm:h-[270px] lg:h-[290px] xl:h-[350px]"
              )}>
                {/* Halo de resplandor ambiental y pedestal luminoso */}
                <div
                  className="pointer-events-none absolute inset-x-8 sm:inset-x-12 inset-y-4 sm:inset-y-6 rounded-full bg-gradient-to-tr from-cyan-500/20 via-teal-500/15 to-transparent blur-[60px] sm:blur-[80px]"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute bottom-1 sm:bottom-2 w-3/4 h-8 sm:h-12 rounded-full bg-cyan-400/25 blur-[30px] sm:blur-[40px]"
                  aria-hidden="true"
                />
                <Auth3DScene />
              </div>

              {/* Identidad y foco institucional */}
              <div className="space-y-2 max-w-xl w-full pt-2 px-1 sm:px-0">
                <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
                  {heroHeadline === "AlfaCode HUB" ? (
                    <>
                      Alfa<span className="text-cyan-400">Code</span>{" "}
                      <span className="font-mono text-cyan-400">HUB</span>
                    </>
                  ) : (
                    heroHeadline
                  )}
                </h1>

                <p className="text-xs sm:text-sm leading-relaxed text-slate-300 max-w-lg mx-auto lg:mx-0">
                  {heroSubheadline}
                </p>

                {/* 3 Pills con áreas de enfoque (con iconos Lucide, sin emojis) */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-md shadow-xs">
                    <Cpu size={12} className="text-cyan-400 shrink-0" aria-hidden="true" />
                    Inteligencia Artificial
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-md shadow-xs">
                    <Code2 size={12} className="text-cyan-400 shrink-0" aria-hidden="true" />
                    Desarrollo de Software
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-md shadow-xs">
                    <ShieldCheck size={12} className="text-cyan-400 shrink-0" aria-hidden="true" />
                    Internet de las cosas (IoT)
                  </span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Frosted Glass de Ingreso Seguro */}
            <div className={cn("relative w-full min-w-0 mx-auto", wideCard ? "max-w-2xl lg:max-w-none lg:col-span-7" : "max-w-md lg:max-w-none lg:col-span-5")}>
              {/* Resplandor ambiental exterior de la tarjeta */}
              <div
                className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-b from-cyan-500/15 via-transparent to-transparent opacity-25 dark:opacity-40 blur-xl"
                aria-hidden="true"
              />
              <section
                aria-labelledby="auth-title"
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-cyan-400/25 bg-slate-950/85 p-5 sm:p-7 lg:p-8 shadow-xl dark:shadow-[var(--panel-shadow),0_0_20px_rgba(3,130,161,0.1)] backdrop-blur-3xl transition-all duration-300 hover:border-cyan-400/40"
              >
                {/* Línea superior con gradiente de luz cian */}
                <div
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                  aria-hidden="true"
                />

                {/* Insignia superior de la tarjeta */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300 shadow-xs">
                    <span className="flex size-3.5 items-center justify-center">
                      <AlfaCodeSymbol className="size-full" />
                    </span>
                    <span>{badge}</span>
                  </div>
                </div>

                {/* Título y descripción de la tarjeta */}
                <div className="mt-3">
                  <h2
                    id="auth-title"
                    className="text-xl sm:text-2xl font-bold tracking-tight text-white text-balance"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-300">
                      {description}
                    </p>
                  )}
                </div>

                {/* Formulario (Children) */}
                <div className="mt-4">{children}</div>

                {/* Pie de la tarjeta */}
                {footer && (
                  <div className="mt-4 border-t border-white/10 pt-3 text-center text-xs text-slate-400">
                    {footer}
                  </div>
                )}

                {/* Enlace de regreso */}
                <p className="mt-3 text-center">
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
      )}

      {/* Pie de página institucional integrado */}
      <footer className="relative z-20 mx-auto w-full max-w-7xl shrink-0 px-4 py-4 text-center text-[11px] text-slate-400 sm:px-6 border-t border-white/5">
        <p>
          © 2026 Semillero de Investigación AlfaCode · Universidad de La Guajira · Todos los derechos reservados.
        </p>
      </footer>
    </PublicThemeProvider>
  );
}
