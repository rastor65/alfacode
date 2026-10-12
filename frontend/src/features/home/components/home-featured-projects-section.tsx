import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { ProjectCard } from "@/features/projects/components/project-card";
import type { Project } from "@/types/domain";

type HomeFeaturedProjectsSectionProps = {
  projects: Project[];
};

export function HomeFeaturedProjectsSection({
  projects,
}: HomeFeaturedProjectsSectionProps) {
  return (
    <section className="relative overflow-hidden border-y border-cyan-500/15 bg-gradient-to-b from-[#071018] via-[#081522] to-[#071018] py-24">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute right-10 top-1/2 size-80 -translate-y-1/2 rounded-full bg-[#469eb4]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
              <span className="size-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
              Proyectos Destacados
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Los proyectos cuentan la historia técnica de AlfaCode.
            </h2>
            <p className="mt-3 max-w-2xl text-base text-slate-300">
              Soluciones funcionales donde cada desarrollo articula marco investigativo, arquitectura en la nube, pruebas y métricas de impacto real.
            </p>
          </div>
          <ButtonLink
            href="/proyectos"
            variant="secondary"
            className="gap-2 shrink-0 self-start md:self-auto"
          >
            Ver todos los proyectos
            <ArrowRight size={16} aria-hidden="true" />
          </ButtonLink>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
