import Link from "next/link";
import { Atom, LogIn } from "lucide-react";

import { publicNavigation, siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button-link";

export function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-4 z-40 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel mx-auto flex h-16 max-w-7xl items-center justify-between rounded-lg px-3 sm:px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md border border-cyan-100/20 bg-[#e1feff]/10 text-[#e1feff] shadow-[0_0_28px_rgba(70,158,180,0.22)]">
            <Atom size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide text-white">
              {siteConfig.name}
            </span>
            <span className="block text-xs text-cyan-100/70">
              {siteConfig.tagline}
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-1 py-2 text-sm text-slate-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e1feff]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ButtonLink href="/login" variant="secondary" className="gap-2">
          <LogIn size={16} aria-hidden="true" />
          Plataforma
        </ButtonLink>
      </div>
    </header>
  );
}
