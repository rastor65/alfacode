import type { Metadata } from "next";

import { PublicHeader } from "@/components/layout/public-header";
import { ProjectCard } from "@/features/projects/components/project-card";
import { projects } from "@/features/projects/data/project-seed";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Proyectos publicos de investigacion y desarrollo de AlfaCode.",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-[#05080d]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
          Proyectos
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Soluciones reales, investigacion conectada.
        </h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Cada proyecto articula problema, tecnologia, integrantes, avances,
          resultados e impacto. Al cambiar su visibilidad a publico, aparece en
          este portal sin duplicar informacion.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>
    </div>
  );
}
