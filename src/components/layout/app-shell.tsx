import Link from "next/link";
import { Atom } from "lucide-react";

import { appNavigation } from "@/config/site";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-slate-950/95 p-5 lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#469eb4] text-slate-950">
            <Atom size={20} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold">AlfaCode</span>
            <span className="text-xs text-slate-400">Plataforma interna</span>
          </span>
        </Link>
        <nav className="space-y-1" aria-label="Interna">
          {appNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
