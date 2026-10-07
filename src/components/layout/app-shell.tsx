import Link from "next/link";
import { Atom, Bell, Search, ShieldCheck } from "lucide-react";
import type { Session } from "next-auth";

import { appNavigation } from "@/config/site";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: Session["user"];
}) {
  const userPermissions = new Set(user.permissions);
  const visibleNavigation = appNavigation.filter((item) =>
    userPermissions.has(item.permission),
  );
  const groupedNavigation = visibleNavigation.reduce<
    Record<string, typeof visibleNavigation>
  >((groups, item) => {
    groups[item.group] ??= [];
    groups[item.group].push(item);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-[#f7fbfc] text-[#10242c]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#14333d] bg-[#08151b] p-5 text-slate-100 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#469eb4] text-slate-950">
            <Atom size={20} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold">AlfaCode</span>
            <span className="text-xs text-slate-400">Plataforma interna</span>
          </span>
        </Link>

        <div className="mt-6 rounded-lg border border-cyan-100/10 bg-cyan-100/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#7ed4e8]">
            <ShieldCheck size={14} aria-hidden="true" />
            Acceso RBAC
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {visibleNavigation.length} recursos disponibles
          </p>
        </div>

        <nav className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Interna">
          {Object.entries(groupedNavigation).map(([group, items]) => (
            <div key={group} className="mb-5">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {group}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:bg-[#469eb4]/14 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#469eb4]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {visibleNavigation.length === 0 ? (
            <p className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
              Tu usuario no tiene recursos asignados.
            </p>
          ) : null}
        </nav>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="truncate text-sm font-medium text-white">
            {user.name ?? user.email}
          </p>
          <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#d5e6ea] bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-[#469eb4] text-slate-950 lg:hidden">
                <Atom size={16} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#10242c]">
                  Plataforma interna
                </span>
                <span className="block text-xs text-[#5d7179]">
                  Gestion del conocimiento AlfaCode
                </span>
              </span>
            </Link>
            <label className="hidden min-h-10 w-full max-w-md items-center gap-2 rounded-md border border-[#d5e6ea] bg-[#f7fbfc] px-3 text-sm text-[#5d7179] lg:flex">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Buscar</span>
              <input
                className="w-full bg-transparent outline-none placeholder:text-[#93a5ac]"
                placeholder="Buscar proyectos, integrantes o publicaciones"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Notificaciones"
                className="flex size-10 items-center justify-center rounded-md border border-[#d5e6ea] bg-white text-[#5d7179] transition hover:border-[#469eb4] hover:text-[#286273]"
              >
                <Bell size={17} aria-hidden="true" />
              </button>
              <div className="hidden text-right sm:block">
                <p className="max-w-48 truncate text-sm font-semibold text-[#10242c]">
                  {user.name ?? user.email}
                </p>
                <p className="text-xs text-[#5d7179]">
                  {user.roles.length > 0 ? user.roles.join(", ") : "Sin rol"}
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-[#d5e6ea] bg-white p-4 shadow-[0_2px_8px_rgba(8,21,27,0.05)] sm:p-6">
              {children}
            </div>
          </div>
        </main>

        <footer className="border-t border-[#d5e6ea] bg-white px-4 py-4 text-xs text-[#5d7179] sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>AlfaCode Research & Software Lab</p>
            <p>Gestionar una vez, reutilizar datos, publicar automaticamente.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
