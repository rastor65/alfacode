import Link from "next/link";
import { Mail } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { GithubIcon } from "@/components/icons/github-icon";
import { siteConfig } from "@/config/site";

export function HomeFooter() {
  return (
    <footer className="bg-site-bg px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          {/* Marca & Institución */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex size-9 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 p-1.5 text-cyan-200 shadow-[0_0_15px_rgba(70,158,180,0.2)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Inicio de AlfaCode"
            >
              <AlfaCodeSymbol className="size-full text-cyan-300" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  Alfa<span className="text-cyan-400">Code</span>
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs font-mono text-cyan-300/80">
                  {siteConfig.links.institution}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Semillero de Investigación en Arquitectura de Software e IA
              </p>
            </div>
          </div>

          {/* Enlaces de Contacto y GitHub */}
          <div className="flex items-center gap-4 text-xs">
            <a
              href={siteConfig.links.contact}
              className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-cyan-200"
              aria-label="Correo de contacto"
            >
              <Mail size={14} className="text-cyan-400" aria-hidden="true" />
              <span>Contacto</span>
            </a>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-cyan-200"
              aria-label="Repositorio de GitHub"
            >
              <GithubIcon size={14} className="text-cyan-400" aria-hidden="true" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Línea inferior compacta */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-4 text-[11px] font-mono text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} AlfaCode HUB · SGPAI. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>Universidad de La Guajira · Riohacha</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
