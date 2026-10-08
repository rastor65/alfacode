import { researchLineIcons } from "@/features/home/data/home-content";
import type { ResearchLine } from "@/types/domain";

type HomeResearchLinesSectionProps = {
  researchLines: ResearchLine[];
};

export function HomeResearchLinesSection({
  researchLines,
}: HomeResearchLinesSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
              Ecosistema
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Investigacion aplicada conectada con software real.
            </h2>
            <p className="mt-4 text-slate-300">
              Una solucion puede atravesar multiples lineas: producto,
              inteligencia artificial, IoT y validacion investigativa.
            </p>
          </div>
          <div className="glass-panel rounded-lg p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {researchLines.map((line, index) => {
                const Icon = researchLineIcons[index % researchLineIcons.length];

                return (
                  <div
                    key={line.id}
                    className="group rounded-md border border-white/10 bg-slate-950/55 p-4 transition hover:border-[#469eb4]/60"
                  >
                    <Icon className="text-[#7ed4e8]" size={22} aria-hidden="true" />
                    <p className="mt-4 font-medium text-white">{line.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {line.description}
                    </p>
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
