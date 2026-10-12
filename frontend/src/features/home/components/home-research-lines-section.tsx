import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { researchLineIcons } from "@/features/home/data/home-content";
import type { ResearchLine } from "@/types/domain";

type HomeResearchLinesSectionProps = {
  researchLines: ResearchLine[];
};

export function HomeResearchLinesSection({
  researchLines,
}: HomeResearchLinesSectionProps) {
  return (
    <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute left-0 top-1/2 size-96 -translate-y-1/2 rounded-full bg-[#469eb4]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
              <span className="size-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
              Ecosistema Científico
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Investigación aplicada conectada con software real.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              En AlfaCode, una solución de software puede articular múltiples líneas de profundización: arquitectura en la nube, modelos de inteligencia artificial, hardware IoT y validación empírica.
            </p>
            <div className="mt-8">
              <ButtonLink href="/investigacion" variant="secondary" className="gap-2">
                Explorar líneas de investigación
                <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>

          <div className="glass-panel relative rounded-2xl p-6 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {researchLines.map((line, index) => {
                const Icon = researchLineIcons[index % researchLineIcons.length];

                return (
                  <div
                    key={line.id}
                    className="glass-card-interactive group relative flex flex-col justify-between rounded-xl p-5"
                  >
                    <div>
                      <div className="flex size-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-950/40 text-cyan-200 shadow-[0_0_15px_rgba(70,158,180,0.15)] transition-transform duration-200 group-hover:scale-105 group-hover:border-cyan-300">
                        <Icon size={20} aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-white transition group-hover:text-cyan-100">
                        {line.name}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {line.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 border-t border-white/5 pt-3 text-[11px] font-medium text-cyan-400/80">
                      <span>Línea Activa</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
