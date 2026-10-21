"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ThemeMenu } from "@/components/theme/theme-menu";

/**
 * Navbar limpia y minimalista exclusiva para los módulos de autenticación y postulación:
 * - Botón para volver a Home.
 * - Botón de navegación entre Ingreso y Registro (y viceversa).
 * - Selector de tema claro / oscuro.
 * - Sin botones de interacción con la landing page (sin anclas ni enlaces de secciones).
 */
export function AuthHeader() {
  const pathname = usePathname();
  const isIngresar = pathname === "/ingresar";
  const isRegistro = pathname === "/registro";

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6 lg:px-8">
      <div
        className="relative mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full px-3 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-500/40 sm:h-15 sm:px-6 lg:max-w-6xl"
        style={{
          background: "var(--site-header-bg)",
          borderColor: "var(--site-header-border)",
          borderWidth: "1px",
          borderStyle: "solid",
          boxShadow: "var(--site-header-shadow-glow)",
        }}
      >
        {/* Specular highlight on top edge */}
        <div
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
          aria-hidden="true"
        />

        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-full py-1 pr-1.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          title="Ir a página principal de AlfaCode HUB"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-950/70 p-1.5 shadow-[0_0_12px_rgba(70,158,180,0.25)] transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-400/60 sm:size-8.5">
            <AlfaCodeSymbol className="size-full text-cyan-300" />
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              Alfa
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Code
              </span>
            </span>
            <span className="hidden items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-950/40 px-1.5 py-0.5 font-mono text-[10px] font-medium text-cyan-300 md:inline-flex">
              <span className="size-1 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              HUB
            </span>
          </div>
        </Link>

        {/* Acciones de Navegación: Volver a Home, Alternador Ingreso <-> Registro y Modo Oscuro/Claro */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Botón Volver a Home */}
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-full border border-slate-300/70 bg-slate-900/5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-900/10 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:px-3.5"
            title="Volver a la página principal"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Volver a Home</span>
            <span className="sm:hidden">Inicio</span>
          </Link>

          {/* En móvil (< sm): botón contextual directo hacia el módulo opuesto */}
          <div className="sm:hidden">
            {isIngresar ? (
              <Link
                href="/registro"
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-500/25 dark:text-cyan-200"
                title="Ir a formulario de registro"
              >
                <UserPlus size={13} aria-hidden="true" />
                <span>Registro</span>
              </Link>
            ) : (
              <Link
                href="/ingresar"
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-500/25 dark:text-cyan-200"
                title="Ir a ingreso"
              >
                <LogIn size={13} aria-hidden="true" />
                <span>Ingresar</span>
              </Link>
            )}
          </div>

          {/* En desktop (sm y superior): cápsula integrada con ambos accesos */}
          <div
            className="hidden sm:inline-flex items-center rounded-full p-0.5"
            style={{
              background: "var(--site-header-nav-bg)",
              borderColor: "var(--site-header-nav-border)",
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          >
            <Link
              href="/ingresar"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:px-3.5 ${
                isIngresar
                  ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-800 shadow-[0_0_12px_rgba(70,158,180,0.25)] dark:text-cyan-100"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <LogIn size={13} aria-hidden="true" />
              <span>Ingresar</span>
            </Link>

            <Link
              href="/registro"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:px-3.5 ${
                isRegistro
                  ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-800 shadow-[0_0_12px_rgba(70,158,180,0.25)] dark:text-cyan-100"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <UserPlus size={13} aria-hidden="true" />
              <span>Registro</span>
            </Link>
          </div>

          {/* Selector de modo oscuro / claro */}
          <ThemeMenu
            variant="icon"
            placement="bottom"
            align="end"
            triggerClassName="size-8 rounded-full border border-slate-300/70 bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white focus-visible:ring-cyan-400"
          />
        </div>
      </div>
    </header>
  );
}
