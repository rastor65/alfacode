import { Target } from "lucide-react";

import { methodSteps } from "@/features/home/data/home-content";

export function HomeMethodSection() {
  return (
    <section className="relative overflow-hidden border-y border-cyan-500/15 bg-gradient-to-b from-[#071018] via-[#081522]/60 to-[#071018] py-24 px-4 sm:px-6 lg:px-8">
      {/* Soft ambient center glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#469eb4]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/40 text-cyan-200 shadow-[0_0_20px_rgba(70,158,180,0.2)]">
            <Target size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
              <span className="size-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
              Metodología Experimental
            </span>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Del contexto al impacto comprobable.
            </h2>
          </div>
        </div>

        <div className="relative grid gap-5 md:grid-cols-5">
          {/* Connecting line across steps on desktop */}
          <div
            className="flow-line absolute left-6 right-6 top-9 hidden h-[2px] md:block opacity-60"
            aria-hidden="true"
          />

          {methodSteps.map(([number, title, text]) => (
            <div
              key={number}
              className="glass-card-interactive group relative flex flex-col justify-between rounded-2xl p-5 z-10"
            >
              <div>
                <span className="flex size-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-950/90 font-mono text-sm font-bold text-cyan-200 shadow-[0_0_15px_rgba(70,158,180,0.25)] transition-all duration-200 group-hover:scale-105 group-hover:border-cyan-300">
                  {number}
                </span>
                <h3 className="mt-5 text-base font-bold text-white transition group-hover:text-cyan-200">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {text}
                </p>
              </div>

              <div className="mt-5 border-t border-white/5 pt-3 text-[10px] uppercase font-mono tracking-wider text-cyan-400/70">
                Fase {number}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
