import Link from "next/link";
import { Atom, LogIn } from "lucide-react";

import { publicNavigation, siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button-link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05080d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md border border-cyan-100/20 bg-cyan-100/10 text-[#e1feff]">
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
              className="text-sm text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ButtonLink href="/app/dashboard" variant="secondary" className="gap-2">
          <LogIn size={16} aria-hidden="true" />
          App
        </ButtonLink>
      </div>
    </header>
  );
}
