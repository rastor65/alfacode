import { ArrowRight } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ButtonLink } from "@/components/ui/button-link";
import { homeStats } from "@/features/home/data/home-content";
import { HomeHeroPipeline } from "@/features/home/components/home-hero-pipeline";

export function HomeHeroSection() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-20">
      {/* Ambient background glows with subtle parallax drift */}
      <div
        className="pointer-events-none absolute left-1/4 top-10 size-96 rounded-full bg-[#469eb4]/15 blur-3xl animate-parallax-float"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/3 size-80 rounded-full bg-cyan-500/10 blur-3xl animate-parallax-float-delayed"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl content-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8">
        {/* Left Column: Vision & Action */}
        <div className="flex flex-col justify-center">
          <div className="animate-hero-fade-in stagger-hero-1">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-cyan-950/50 py-1 pl-1.5 pr-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 shadow-[0_0_20px_rgba(70,158,180,0.2)] transition-transform duration-300 hover:scale-[1.02]">
              <span className="flex size-5 items-center justify-center rounded-full bg-cyan-500/20 p-0.5">
                <AlfaCodeSymbol className="size-full" />
              </span>
              Semillero de Investigación &amp; Software Lab
            </span>
          </div>

          <h1 className="text-balance animate-hero-fade-in stagger-hero-2 mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-6xl xl:text-7xl">
            Investigamos problemas.{" "}
            <span className="relative mt-2 block w-fit">
              {/* Color sólido de alta energía institucional (sin gradiente) */}
              <span className="text-cyan-400 dark:text-cyan-300 drop-shadow-[0_0_22px_rgba(34,211,238,0.3)]">
                Construimos soluciones.
              </span>
            </span>
          </h1>

          <p className="animate-hero-fade-in stagger-hero-3 mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Software de vanguardia, IA e investigación aplicada. Convertimos desafíos en soluciones tecnológicas funcionales y transferibles.
          </p>

          <div className="animate-hero-fade-in stagger-hero-4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/proyectos" variant="primary" className="gap-2.5">
              Explorar proyectos
              <ArrowRight size={17} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/investigacion" variant="secondary">
              Líneas de investigación
            </ButtonLink>
          </div>

          {/* Stats Bar */}
          <div className="animate-hero-fade-in stagger-hero-4 mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {homeStats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`scroll-reveal stagger-${idx + 1} glass-card-interactive rounded-xl p-4`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-site-highlight">
                      {stat.value}
                    </span>
                    <Icon size={18} className="text-site-eyebrow" aria-hidden="true" />
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

        {/* Right Column: Interactive Lifecycle Pipeline with Eased Entrance */}
        <div className="animate-hero-fade-in stagger-hero-3 flex flex-col justify-center">
          <HomeHeroPipeline />
        </div>
      </div>
    </section>
  );
}
