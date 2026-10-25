"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { publicNavigation } from "@/config/site";
import "./public-header.css";

export function PublicHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const navigationId = useId();

  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    navigationRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    // Mismo umbral que la container query: el menú depende del espacio real del header.
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 960) setMenuOpen(false);
    });
    if (headerRef.current) observer.observe(headerRef.current);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} aria-label="Barra del portal público" className="public-bar-header fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6 lg:px-8">
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
          title="AlfaCode HUB · Ir al inicio"
          onClick={() => setMenuOpen(false)}
        >
          <span className="public-bar-symbol-wrap">
            <AlfaCodeSymbol className="size-full text-cyan-300" />
          </span>
          <div className="flex items-center gap-2">
            <span className="public-bar-logo-text">
              Alfa
              <span className="public-bar-logo-gradient">Code</span>
            </span>
            <span className="public-bar-badge">
              <span className="public-bar-badge-dot animate-pulse" aria-hidden="true" />
              Lab
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Capsule */}
        <nav className="public-bar-nav public-bar-desktop-nav" aria-label="Navegación Principal">
          {publicNavigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
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
            className={`public-bar-btn-login public-bar-login focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              pathname === "/ingresar" ? "border-cyan-400 shadow-[0_0_18px_rgba(148,238,254,0.5)]" : ""
            }`}
            title="Ingresar a AlfaCode HUB"
            aria-label="Ingresar a AlfaCode HUB"
            onClick={() => setMenuOpen(false)}
          >
            <LogIn size={15} aria-hidden="true" />
            <span className="public-bar-login-label">Ingresar</span>
          </Link>
          <button ref={triggerRef} type="button" className="public-bar-icon-button public-bar-menu-toggle"
            aria-label={menuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={menuOpen} aria-controls={navigationId}
            onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav ref={navigationRef} id={navigationId} className="public-bar-drawer public-bar-mobile-nav" aria-label="Navegación móvil del portal">
          {publicNavigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={`public-bar-drawer-item${active ? " public-bar-drawer-item-active" : ""}`}
              onClick={() => setMenuOpen(false)}>{item.label}</Link>;
          })}
        </nav>
      )}
    </header>
  );
}
