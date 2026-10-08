import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { homeStats, processSteps } from "@/features/home/data/home-content";

export function HomeHeroSection() {
  return (
    <section className="node-grid relative overflow-hidden border-b border-white/10 pt-24">
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#071018] to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl content-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="max-w-4xl">
          <p className="inline-flex rounded-full border border-cyan-100/15 bg-cyan-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#9de8f5]">
            Research & Software Lab
          </p>
          <h1 className="text-balance mt-7 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Investigamos problemas. Construimos soluciones.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Desarrollo de software, inteligencia artificial e investigacion
            aplicada para transformar problemas reales en soluciones
            tecnologicas funcionales, medibles y publicables.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/proyectos" className="gap-2">
              Explorar proyectos
              <ArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/investigacion" variant="secondary">
              Conocer AlfaCode
            </ButtonLink>
          </div>
          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
            {homeStats.map((stat) => (
              <div key={stat.label} className="bg-[#071018]/80 p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {stat.label}
                </dt>
                <dd className="mt-2 text-3xl font-semibold text-[#e1feff]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass-panel relative rounded-lg p-5">
          <div
            className="absolute inset-4 rounded-lg border border-cyan-100/10"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Arquitectura de impacto
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Problema a solucion tecnologica
                </p>
              </div>
              <span className="rounded-full border border-[#469eb4]/30 bg-[#469eb4]/10 px-3 py-1 text-xs text-[#e1feff]">
                sistema vivo
              </span>
            </div>
            <div className="space-y-3">
              {processSteps.map((step, index) => (
                <div
                  key={step}
                  className="grid grid-cols-[2.5rem_1fr] items-center gap-3"
                >
                  <div className="relative flex size-10 items-center justify-center rounded-md border border-cyan-100/15 bg-slate-950/70 text-xs font-semibold text-[#e1feff]">
                    {String(index + 1).padStart(2, "0")}
                    {index < processSteps.length - 1 ? (
                      <span
                        className="absolute left-1/2 top-full h-3 w-px bg-[#469eb4]/60"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.055] px-4 py-3 transition hover:border-[#469eb4]/50 hover:bg-white/[0.08]">
                    <p className="text-sm font-medium text-white">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
