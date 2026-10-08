import { ArrowRight, Sparkles, Users } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";

export function HomeCallToAction() {
  return (
    <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel relative mx-auto overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-14 max-w-7xl border border-cyan-400/25 shadow-[0_20px_70px_rgba(2,8,14,0.6)]">
        {/* Ambient radial spotlights */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#469eb4]/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-[#7ed4e8]/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles size={14} className="text-cyan-400" aria-hidden="true" />
              Convocatoria & Vinculación
            </div>

            <h2 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              No necesitas tener todas las respuestas. Necesitas una pregunta que valga la pena investigar.
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              AlfaCode busca mentes curiosas: estudiantes e investigadores apasionados por la inteligencia artificial, el desarrollo de software y la ingeniería para construir tecnología de impacto real.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col shrink-0">
            <ButtonLink href="/contacto" variant="primary" className="gap-2.5 px-7 py-3 text-base">
              Quiero ser parte
              <ArrowRight size={17} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/equipo" variant="secondary" className="gap-2.5 px-6 py-3 text-base">
              <Users size={17} aria-hidden="true" />
              Conocer al equipo
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
