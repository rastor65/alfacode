import Link from "next/link";
import { Atom, ExternalLink, Mail } from "lucide-react";

import { publicNavigation, siteConfig } from "@/config/site";

export function HomeFooter() {
  return (
    <footer className="border-t border-cyan-500/15 bg-gradient-to-b from-[#071018] to-[#04090e] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/40 text-cyan-200 shadow-[0_0_20px_rgba(70,158,180,0.2)]">
                <Atom size={20} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-base font-bold tracking-wide text-white">
                  {siteConfig.name}
                </span>
                <span className="block text-xs font-medium text-cyan-200/70">
                  {siteConfig.tagline}
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Semillero institucional de investigación y desarrollo de software enfocado en resolver problemáticas complejas mediante arquitectura moderna, IA, IoT y rigor científico.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Explorar Portal
            </p>
            <ul className="mt-4 space-y-2.5">
              {publicNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-300 transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform & Community */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Plataforma & Redes
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition hover:text-white"
                >
                  Acceso a Plataforma Interna
                  <ExternalLink size={13} className="text-cyan-400" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <a
                  href={siteConfig.links.contact}
                  className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                >
                  <Mail size={15} className="text-cyan-400" aria-hidden="true" />
                  contacto@alfacode.dev
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                >
                  <svg
                    className="size-4 fill-current text-cyan-400"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  GitHub Organization
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Construyendo conocimiento, desarrollando soluciones.
          </p>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>Infraestructura Cloud Vercel + Neon PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
