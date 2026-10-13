"use client";

import { LayoutDashboard, type LucideIcon, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { type RoleCode, type SessionUser, roleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Si se indica, el enlace solo se muestra a esos roles. Es solo presentacion: el backend autoriza. */
  roles?: RoleCode[];
};

/** Menu lateral. Solo incluye vistas ya implementadas; las de gestion llegan en I-09. */
const NAVIGATION: NavigationItem[] = [{ href: "/panel", label: "Panel", icon: LayoutDashboard }];

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

type AppShellProps = {
  user: SessionUser;
  children: React.ReactNode;
};

/**
 * Estructura de las vistas privadas: header superior, menu lateral y contenido, separados
 * solo por lineas finas. Por debajo de `lg` el menu lateral se abre como panel desde el header.
 */
export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const items = NAVIGATION.filter((item) => !item.roles || item.roles.some((role) => user.roles.includes(role)));

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    // Al abrir, el foco entra al menu; Escape lo cierra y devuelve el foco al boton.
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <nav aria-label="Menú principal" className="flex-1">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                    active
                      ? "bg-hub-hover font-medium text-hub-text"
                      : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                  )}
                >
                  <Icon size={17} aria-hidden="true" className={active ? "text-hub-accent" : undefined} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-0.5 border-t border-hub-border pt-3">
        <ThemeMenu />
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-hub-panel focus:px-3 focus:py-2 focus:text-sm focus:text-hub-text focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-hub-border bg-hub-bg/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="app-sidebar-mobile"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
          <Link
            href="/panel"
            className="flex min-w-0 items-center gap-2 rounded-md text-sm font-semibold tracking-tight text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <AlfaCodeSymbol className="size-5 shrink-0" />
            <span className="truncate">
              AlfaCode <span className="font-normal text-hub-muted">HUB</span>
            </span>
          </Link>
        </div>

        <div className="flex min-w-0 items-center gap-2.5">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm text-hub-text">{user.fullName}</p>
            <p className="truncate text-xs text-hub-muted">{user.roles.map(roleLabel).join(" · ")}</p>
          </div>
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hub-accent-soft text-xs font-semibold text-hub-accent"
            aria-hidden="true"
          >
            {initials(user.fullName)}
          </span>
        </div>
      </header>

      {menuOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            ref={drawerRef}
            id="app-sidebar-mobile"
            aria-label="Menú"
            className="fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] overflow-y-auto border-r border-hub-border bg-hub-bg p-4 shadow-xl"
          >
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-hub-border p-3 lg:block">
          {sidebar}
        </aside>
        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 px-4 py-8 focus:outline-none sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
