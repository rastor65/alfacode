"use client";

import { useState } from "react";
import { FolderKanban, Search, Sparkles } from "lucide-react";

import { ProjectCard } from "@/features/projects/components/project-card";
import type { Project } from "@/types/domain";

type PublicProjectsPageProps = {
  projects: Project[];
};

export function PublicProjectsPage({ projects }: PublicProjectsPageProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter((project) => {
    const matchesLine =
      selectedFilter === "ALL" ||
      project.researchLines.some(
        (line) => line.slug === selectedFilter || line.id === selectedFilter
      );

    const matchesSearch =
      searchQuery.trim() === "" ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.technologies.some((tech) =>
        tech.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesLine && matchesSearch;
  });

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-[0.24em] text-cyan-200">
          <FolderKanban size={14} className="text-cyan-400" aria-hidden="true" />
          Portafolio de Soluciones &amp; Prototipos
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Proyectos AlfaCode
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          Cada proyecto articula problema, tecnología, integrantes, avances, resultados e impacto real transferible.
        </p>
      </div>

      {/* Filtros por Línea y Buscador */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Pestañas de Filtro */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "ALL", label: "Todos los Proyectos" },
            { id: "software", label: "Desarrollo Software" },
            { id: "ai", label: "Inteligencia Artificial" },
            { id: "iot", label: "IoT" },
            { id: "applied-research", label: "Investigación Aplicada" },
          ].map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`rounded-lg px-4 py-2 text-xs font-mono font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? "border border-cyan-400/50 bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(70,158,180,0.25)]"
                    : "border border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Buscador de Proyectos */}
        <div className="relative min-w-[240px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tecnología, nombre..."
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-400 backdrop-blur-md transition-colors focus:border-cyan-400/60 focus:bg-slate-900/90 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>
      </div>

      {/* Grid de Proyectos */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center text-slate-400">
            <p className="text-sm">No se encontraron proyectos con los criterios de búsqueda actuales.</p>
          </div>
        ) : (
          filteredProjects.map((project, idx) => (
            <div key={project.id} className={`scroll-reveal stagger-${(idx % 6) + 1}`}>
              <ProjectCard project={project} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
