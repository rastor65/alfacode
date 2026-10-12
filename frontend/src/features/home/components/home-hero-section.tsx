import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { homeStats } from "@/features/home/data/home-content";
import { HomeHeroPipeline } from "@/features/home/components/home-hero-pipeline";

export function HomeHeroSection() {
  return (
    <section className="node-grid relative overflow-hidden border-b border-cyan-500/10 pt-28 pb-16 lg:pt-32 lg:pb-24">
      {/* Soft gradient bottom blend */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#071018] via-[#071018]/80 to-transparent"
        aria-hidden="true"
      />

      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute left-1/4 top-10 size-96 rounded-full bg-[#469eb4]/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl content-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8">
        {/* Left Column: Vision & Action */}
        <div className="flex flex-col justify-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 shadow-[0_0_20px_rgba(70,158,180,0.2)]">
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
              Research & Software Lab
            </span>
          </div>

          <h1 className="text-balance mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-6xl xl:text-7xl">
            Investigamos problemas.{" "}
            <span className="block bg-gradient-to-r from-white via-cyan-100 to-[#7ed4e8] bg-clip-text text-transparent">
              Construimos soluciones.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Desarrollo de software de vanguardia, inteligencia artificial e investigación aplicada. Transformamos desafíos reales en soluciones tecnológicas funcionales, medibles y transferibles a la sociedad.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/proyectos" variant="primary" className="gap-2.5">
              Explorar proyectos
              <ArrowRight size={17} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/investigacion" variant="secondary">
              Líneas de investigación
            </ButtonLink>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {homeStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="glass-card-interactive rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-[#e1feff]">
                      {stat.value}
                    </span>
                    <Icon size={18} className="text-[#7ed4e8]" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-200">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {stat.sublabel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Lifecycle Pipeline */}
        <div className="flex flex-col justify-center">
          <HomeHeroPipeline />
        </div>
      </div>
    </section>
  );
}
