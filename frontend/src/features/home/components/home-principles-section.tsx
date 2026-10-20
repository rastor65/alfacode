import { homePrinciples } from "@/features/home/data/home-content";

export function HomePrinciplesSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      {/* Ambient background glow with parallax drift */}
      <div
        className="pointer-events-none absolute -left-20 top-1/2 size-72 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-parallax-float-slow"
        aria-hidden="true"
      />
      <div className="mb-12 max-w-3xl">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-site-eyebrow">
          <span className="size-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
          Modelo Institucional
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Una plataforma para investigar, construir y publicar con rigor.
        </h2>
        <p className="mt-3 text-base text-slate-300">
          Convertimos la investigación en un ciclo ágil con software auditable, rigor científico y datos abiertos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {homePrinciples.map((principle, idx) => {
          const Icon = principle.icon;
          return (
            <div
              key={principle.title}
              className={`scroll-reveal stagger-${idx + 1} glass-card-interactive group relative flex flex-col justify-between overflow-hidden rounded-xl p-6`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-950/40 text-cyan-200 shadow-[0_0_20px_rgba(70,158,180,0.18)] transition-transform duration-200 group-hover:scale-105 group-hover:border-cyan-300">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs font-semibold tracking-wider text-cyan-300/80">
                    {principle.tag}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-white transition group-hover:text-cyan-100">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {principle.text}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-white/5 pt-4 text-xs font-medium text-cyan-400/80">
                <span>Metodología AlfaCode</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
