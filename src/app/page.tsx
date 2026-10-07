import { Activity, ArrowRight, BrainCircuit, Cpu, Database } from "lucide-react";

import { PublicHeader } from "@/components/layout/public-header";
import { ButtonLink } from "@/components/ui/button-link";
import { ProjectCard } from "@/features/projects/components/project-card";
import { projects, researchLines } from "@/features/projects/data/project-seed";

const stats = [
  { label: "Proyectos iniciales", value: "5" },
  { label: "Lineas de investigacion", value: "4" },
  { label: "Modelo de datos", value: "1 fuente" },
];

const principles = [
  {
    icon: Database,
    title: "Gestionar una vez",
    text: "Los datos nacen en la plataforma interna y se reutilizan en el portal publico.",
  },
  {
    icon: BrainCircuit,
    title: "Investigar mientras se construye",
    text: "Cada proyecto conecta problema, tecnologia, metodologia, resultados e impacto.",
  },
  {
    icon: Cpu,
    title: "Software aplicable",
    text: "La prioridad es crear soluciones reales, mantenibles y medibles.",
  },
];

export default function Home() {
  const featuredProjects = projects.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#05080d]">
      <PublicHeader />
      <main>
        <section className="node-grid border-b border-white/10">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl content-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#7ed4e8]">
                Research & Software Lab
              </p>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                AlfaCode gestiona conocimiento, proyectos e investigacion aplicada.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Una plataforma institucional para administrar el semillero y
                publicar automaticamente sus proyectos, integrantes,
                publicaciones, eventos y logros desde una unica fuente de datos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/proyectos" className="gap-2">
                  Ver proyectos
                  <ArrowRight size={16} aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/app/dashboard" variant="secondary">
                  Entrar a la plataforma
                </ButtonLink>
              </div>
            </div>

            <div className="glass-panel rounded-lg p-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="flex size-10 items-center justify-center rounded-md bg-[#469eb4] text-slate-950">
                  <Activity size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-white">Sistema institucional</p>
                  <p className="text-sm text-slate-400">
                    Datos internos que alimentan presencia publica.
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-md bg-white/[0.05] p-4">
                    <dt className="text-xs text-slate-400">{stat.label}</dt>
                    <dd className="mt-2 text-2xl font-semibold text-[#e1feff]">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 space-y-3">
                {researchLines.map((line) => (
                  <div
                    key={line.id}
                    className="rounded-md border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-medium text-white">{line.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{line.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
              >
                <principle.icon className="text-[#7ed4e8]" size={24} aria-hidden="true" />
                <h2 className="mt-5 text-lg font-semibold text-white">
                  {principle.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {principle.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
                  Proyectos
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Nucleo de la plataforma
                </h2>
              </div>
              <ButtonLink href="/proyectos" variant="secondary">
                Ver todos
              </ButtonLink>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
