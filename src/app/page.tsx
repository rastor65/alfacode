import {
  ArrowRight,
  BrainCircuit,
  Cpu,
  Database,
  FlaskConical,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react";

import { PublicHeader } from "@/components/layout/public-header";
import { ButtonLink } from "@/components/ui/button-link";
import { ProjectCard } from "@/features/projects/components/project-card";
import { getPublicProjects } from "@/features/projects/services/project-repository";
import { getPublicResearchLines } from "@/features/research/services/research-repository";

export const revalidate = 60;

const stats = [
  { label: "Proyectos iniciales", value: "5" },
  { label: "Lineas de investigacion", value: "04" },
  { label: "Publicacion de datos", value: "1 fuente" },
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

const processSteps = [
  "Problema",
  "Investigacion",
  "Diseno",
  "Desarrollo",
  "IA / IoT",
  "Solucion",
  "Impacto",
];

const methodSteps = [
  ["01", "Identificamos", "Analizamos una problematica real y su contexto."],
  ["02", "Investigamos", "Exploramos antecedentes, necesidades y oportunidades."],
  ["03", "Disenamos", "Definimos arquitectura, experiencia y estrategia tecnica."],
  ["04", "Desarrollamos", "Construimos prototipos y soluciones funcionales."],
  ["05", "Validamos", "Medimos resultados y convertimos hallazgos en conocimiento."],
];

export default async function Home() {
  const [projects, researchLines] = await Promise.all([
    getPublicProjects(),
    getPublicResearchLines(),
  ]);
  const featuredProjects = projects.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#071018]">
      <PublicHeader />
      <main>
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
                {stats.map((stat) => (
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
              <div className="absolute inset-4 rounded-lg border border-cyan-100/10" aria-hidden="true" />
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
                    <div key={step} className="grid grid-cols-[2.5rem_1fr] items-center gap-3">
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

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
              Modelo institucional
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Una plataforma para investigar, construir y publicar.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="glass-panel rounded-lg p-5 transition duration-300 hover:-translate-y-1"
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

        <section className="section-light border-y border-cyan-950/10">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#287f92]">
                  Proyectos
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-[#071822] sm:text-4xl">
                  Los proyectos cuentan la historia tecnica de AlfaCode.
                </h2>
              </div>
              <ButtonLink
                href="/proyectos"
                variant="secondary"
                className="border-cyan-950/15 bg-white/70 text-[#08202b] hover:bg-white"
              >
                Ver todos
              </ButtonLink>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>

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
                    const icons = [Layers3, BrainCircuit, Cpu, FlaskConical];
                    const Icon = icons[index % icons.length];
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

        <section className="border-y border-white/10 bg-white/[0.025] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-center gap-3">
              <Target className="text-[#7ed4e8]" size={24} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
                  Como trabajamos
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Del contexto al impacto.
                </h2>
              </div>
            </div>
            <div className="relative grid gap-4 md:grid-cols-5">
              <div className="flow-line absolute left-0 right-0 top-8 hidden h-px md:block" aria-hidden="true" />
              {methodSteps.map(([number, title, text]) => (
                <div key={number} className="relative rounded-lg border border-white/10 bg-[#071018] p-5">
                  <span className="flex size-12 items-center justify-center rounded-md border border-[#469eb4]/40 bg-[#469eb4]/10 text-sm font-semibold text-[#e1feff]">
                    {number}
                  </span>
                  <h3 className="mt-5 font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="glass-panel mx-auto grid max-w-7xl gap-8 rounded-lg p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Sparkles className="text-[#7ed4e8]" size={24} aria-hidden="true" />
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold text-white">
                No necesitas tener todas las respuestas. Necesitas una pregunta
                que valga la pena investigar.
              </h2>
              <p className="mt-4 max-w-2xl text-slate-300">
                AlfaCode busca estudiantes interesados en crear, investigar,
                experimentar y construir productos tecnologicos con impacto.
              </p>
            </div>
            <ButtonLink href="/contacto" className="gap-2">
              Quiero ser parte
              <ArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">AlfaCode</p>
            <p className="mt-2 text-sm text-slate-400">
              Investigacion / Software / Inteligencia Artificial / Innovacion
            </p>
          </div>
          <p className="text-sm text-slate-400">
            Construyendo conocimiento. Desarrollando soluciones.
          </p>
        </div>
      </footer>
    </div>
  );
}
