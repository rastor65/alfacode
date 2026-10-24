"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { publicNavigation } from "@/config/site";
import "./public-header.css";

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
      <div className="public-bar-deck">
        {/* Fondo de red y resplandores recortados al óvalo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden="true">
          <span className="public-bar-edge-highlight" />
          <svg
            className="public-bar-network"
            viewBox="0 0 800 100"
            fill="none"
            focusable="false"
          >
            <path d="M0 76h126l30-30h136l32-32h106m-220 62h160l32-32h156l28-28h214M464 100l28-28h148l26-26h134" />
            <circle cx="126" cy="76" r="3" />
            <circle cx="292" cy="46" r="3" />
            <circle cx="430" cy="14" r="3" />
            <circle cx="558" cy="44" r="3" />
            <circle cx="640" cy="72" r="3" />
          </svg>
        </div>

        {/* Brand / Logo */}
        <Link
          href="/"
          className={`group public-bar-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isHome ? "scale-[1.02]" : ""
          }`}
          onClick={() => setMobileMenuOpen(false)}
          title="AlfaCode HUB · Ir al inicio"
        >
          <span className="public-bar-symbol-wrap">
            <AlfaCodeSymbol className="size-full text-cyan-300" />
          </span>
          <div className="flex items-center gap-2">
            <span className="public-bar-logo-text">
              Alfa
              <span className="public-bar-logo-gradient">Code</span>
            </span>
            <span className="hidden sm:inline-flex public-bar-badge">
              <span className="public-bar-badge-dot animate-pulse" aria-hidden="true" />
              Lab
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Capsule */}
        <nav className="hidden md:flex public-bar-nav" aria-label="Navegación Principal">
          {publicNavigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`public-bar-nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive ? "public-bar-nav-item-active" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Acciones y tema */}
        <div className="public-bar-actions">
          <ThemeMenu
            variant="icon"
            placement="bottom"
            align="end"
            triggerClassName="public-bar-icon-button focus-visible:ring-2 focus-visible:ring-cyan-400"
            menuClassName="public-bar-theme-menu"
          />

          <Link
            href="/ingresar"
            className={`hidden sm:inline-flex public-bar-btn-login focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              pathname === "/ingresar" ? "border-cyan-400 shadow-[0_0_18px_rgba(148,238,254,0.5)]" : ""
            }`}
            title="Ingresar a AlfaCode HUB"
          >
            <LogIn size={15} aria-hidden="true" />
            <span>Ingresar</span>
          </Link>

          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="public-bar-icon-button md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu & Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-[72px] z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="public-bar-drawer md:hidden">
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
                    className={`public-bar-drawer-item ${
                      isActive ? "public-bar-drawer-item-active" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/ingresar"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2.5 flex items-center justify-center gap-2 public-bar-btn-login w-full py-2.5"
              >
                <LogIn size={16} aria-hidden="true" />
                <span>Ingresar a AlfaCode HUB</span>
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
