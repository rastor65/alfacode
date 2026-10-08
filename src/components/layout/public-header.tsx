"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Atom, LogIn, Menu, X } from "lucide-react";

import { publicNavigation, siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button-link";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel mx-auto flex h-16 max-w-7xl items-center justify-between rounded-xl px-4 sm:px-6 transition-all duration-200">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071018] rounded-lg"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="relative flex size-10 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/40 text-cyan-200 shadow-[0_0_24px_rgba(70,158,180,0.25)] transition-all duration-200 group-hover:border-cyan-300 group-hover:shadow-[0_0_30px_rgba(70,158,180,0.45)]">
            <Atom size={20} className="transition-transform duration-300 group-hover:rotate-45" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-cyan-400" />
            </span>
          </span>
          <div>
            <span className="block text-sm font-bold tracking-wide text-white transition group-hover:text-cyan-200">
              {siteConfig.name}
            </span>
            <span className="block text-[11px] font-medium text-cyan-200/70">
              {siteConfig.tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación Principal">
          {publicNavigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? "text-cyan-200 bg-cyan-950/40 shadow-[inset_0_1px_0_rgba(126,212,232,0.2)]"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <ButtonLink
            href="/login"
            variant="secondary"
            className="hidden sm:inline-flex gap-2 text-xs font-semibold uppercase tracking-wider py-2 px-3.5"
          >
            <LogIn size={15} aria-hidden="true" />
            Plataforma
          </ButtonLink>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="glass-panel mx-auto mt-2 max-w-7xl rounded-xl p-4 md:hidden shadow-2xl border border-cyan-400/20 backdrop-blur-2xl">
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
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-200 border-l-2 border-cyan-400"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-3 border-t border-white/10 pt-3">
              <ButtonLink
                href="/login"
                variant="primary"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full gap-2 text-center"
              >
                <LogIn size={16} aria-hidden="true" />
                Acceder a Plataforma
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
