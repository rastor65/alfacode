import Link from "next/link";
import { ArrowLeft, Compass, FolderKanban, Home, Mail } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#05080d] px-4 py-16 text-slate-100">
      {/* Resplandor ambiental de fondo */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl text-center">
        {/* Isotipo con insignia de error */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-950/80 p-4 shadow-[0_0_35px_rgba(70,158,180,0.25)] backdrop-blur-xl">
          <AlfaCodeSymbol className="size-full text-cyan-300" />
        </div>

        {/* Badge HUD */}
        <div className="mt-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-[0.25em] text-cyan-200">
            <Compass size={14} className="text-cyan-400 animate-spin" aria-hidden="true" />
            Error 404 // Recurso Inexistente
          </span>
        </div>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Ruta no encontrada
        </h1>

        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          El endpoint, proyecto o módulo solicitado no existe, ha sido reubicado o no se encuentra disponible en este entorno del semillero.
        </p>

        {/* Tarjeta Glassmorphic de opciones */}
        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-mono uppercase tracking-wider text-cyan-300/90">
            Rutas Recomendadas de Exploración
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/" variant="primary" className="gap-2">
              <Home size={16} aria-hidden="true" />
              Inicio
            </ButtonLink>

            <ButtonLink href="/proyectos" variant="secondary" className="gap-2">
              <FolderKanban size={16} aria-hidden="true" />
              Ver Proyectos
            </ButtonLink>

            <ButtonLink href="/contacto" variant="ghost" className="gap-2">
              <Mail size={16} aria-hidden="true" />
              Contacto
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8 text-xs font-mono text-slate-500">
          AlfaCode HUB · Universidad de La Guajira · SGPAI
        </div>
      </div>
    </div>
  );
}
