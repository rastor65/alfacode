"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { publicNavigation } from "@/config/site";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Cerrar menu movil al cambiar de ruta
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Cerrar menu movil con tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isHome = pathname === "/";

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6 lg:px-8">
      <div
        className="relative mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full px-4 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-500/40 sm:h-15 sm:px-6 lg:max-w-6xl"
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
          className={`group flex items-center gap-2.5 rounded-full pr-1.5 py-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isHome ? "scale-[1.02]" : ""
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <span
            className={`flex size-8.5 items-center justify-center rounded-full p-1.5 transition-all duration-300 group-hover:scale-105 ${
              isHome
                ? "border border-cyan-400/60 bg-gradient-to-br from-cyan-950/90 to-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.45)] animate-logo-accent ring-1 ring-cyan-400/40"
                : "border border-cyan-400/30 bg-cyan-950/70 shadow-[0_0_12px_rgba(70,158,180,0.25)]"
            }`}
          >
            <AlfaCodeSymbol
              className={`size-full transition-colors ${
                isHome ? "text-cyan-200" : "text-cyan-300"
              }`}
            />
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm tracking-tight transition-all ${
                isHome
                  ? "font-extrabold text-white"
                  : "font-bold text-white"
              }`}
            >
              Alfa
              <span
                className={`bg-clip-text text-transparent ${
                  isHome
                    ? "bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]"
                    : "bg-gradient-to-r from-cyan-400 to-teal-400"
                }`}
              >
                Code
              </span>
            </span>
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono transition-all ${
                isHome
                  ? "border border-cyan-400/50 bg-cyan-950/70 font-bold text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/30"
                  : "border border-cyan-400/25 bg-cyan-950/40 font-medium text-cyan-300"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isHome ? "bg-cyan-300 animate-ping" : "bg-emerald-400 animate-pulse"
                }`}
                aria-hidden="true"
              />
              Lab
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Capsule */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full p-1"
          style={{
            background: "var(--site-header-nav-bg)",
            borderColor: "var(--site-header-nav-border)",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
          aria-label="Navegación Principal"
        >
          {publicNavigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? "border border-cyan-500/40 bg-cyan-500/15 font-semibold text-cyan-700 shadow-[inset_0_1px_0_rgba(126,212,232,0.3)] dark:text-cyan-100"
                    : "border border-transparent text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Acciones y tema */}
        <div className="flex items-center gap-2">
          <ThemeMenu
            variant="icon"
            placement="bottom"
            align="end"
            triggerClassName="size-8 rounded-full border border-slate-300/70 bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white focus-visible:ring-cyan-400"
          />
          <Link
            href="/ingresar"
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              pathname === "/ingresar"
                ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-800 shadow-[0_0_15px_rgba(70,158,180,0.3)] dark:text-cyan-100"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 hover:border-cyan-500/60 hover:bg-cyan-500/20 hover:text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-950/40 dark:text-cyan-200 dark:hover:border-cyan-400/60 dark:hover:bg-cyan-900/50 dark:hover:text-white"
            }`}
          >
            <LogIn size={14} aria-hidden="true" />
            Ingresar
          </Link>

          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-8 items-center justify-center rounded-full border border-slate-300/70 bg-slate-900/5 text-slate-700 transition hover:bg-slate-900/10 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu & Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-[68px] z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative mx-auto mt-2 max-w-5xl rounded-2xl p-4 shadow-2xl backdrop-blur-2xl md:hidden z-50"
            style={{
              background: "var(--site-header-bg)",
              borderColor: "var(--site-header-border)",
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          >
            <nav className="flex flex-col gap-1.5" aria-label="Menú Móvil">
              {publicNavigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border border-cyan-500/35 bg-cyan-500/15 font-semibold text-cyan-800 shadow-[0_0_12px_rgba(70,158,180,0.2)] dark:text-cyan-100"
                        : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/ingresar"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-cyan-500/35 bg-cyan-500/10 py-2.5 text-sm font-semibold text-cyan-800 transition hover:border-cyan-500/60 hover:bg-cyan-500/20 dark:border-cyan-400/30 dark:bg-cyan-950/50 dark:text-cyan-100 dark:hover:border-cyan-400/60 dark:hover:bg-cyan-900/60"
              >
                <LogIn size={16} aria-hidden="true" />
                Ingresar a AlfaCode HUB
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
