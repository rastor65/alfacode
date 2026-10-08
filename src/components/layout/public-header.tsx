"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Atom, LogIn, Menu, X } from "lucide-react";

import { publicNavigation } from "@/config/site";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-3 sm:top-4 z-50 px-3 sm:px-6">
      <div className="mx-auto flex h-13 sm:h-14 max-w-4xl items-center justify-between rounded-full border border-white/[0.09] bg-[#06111a]/85 px-3 sm:px-4 shadow-[0_10px_35px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-all duration-200">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-full pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(70,158,180,0.25)] transition-transform duration-300 group-hover:scale-105">
            <Atom size={16} aria-hidden="true" />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              Alfa<span className="bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">Code</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              Lab
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Capsule */}
        <nav
          className="hidden md:flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] p-1"
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
                    ? "bg-white/10 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-300 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.3)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <LogIn size={13} className="text-slate-950" aria-hidden="true" />
            <span>Plataforma</span>
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-4xl rounded-2xl border border-white/10 bg-[#06111a]/95 p-4 md:hidden shadow-2xl backdrop-blur-2xl">
          <nav className="flex flex-col gap-1" aria-label="Menú Móvil">
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
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-200 font-semibold"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-white/10 pt-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 py-2.5 text-xs font-semibold text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                <LogIn size={14} aria-hidden="true" />
                <span>Acceder a Plataforma</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
