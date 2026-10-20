"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FolderKanban, Search } from "lucide-react";

import { ProjectCard } from "@/features/projects/components/project-card";
import type { Project } from "@/types/domain";

type PublicProjectsPageProps = {
  projects: Project[];
};

const PAGE_SIZE = 3;

export function PublicProjectsPage({ projects }: PublicProjectsPageProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

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
      ) ||
      (project.developers &&
        project.developers.some((dev) =>
          dev.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    return matchesLine && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + PAGE_SIZE);

  const startCount = filteredProjects.length > 0 ? startIndex + 1 : 0;
  const endCount = Math.min(startIndex + PAGE_SIZE, filteredProjects.length);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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
                onClick={() => handleFilterChange(tab.id)}
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
        <div className="relative min-w-[260px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por tecnología, autor, nombre..."
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-400 backdrop-blur-md transition-colors focus:border-cyan-400/60 focus:bg-slate-900/90 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>
      </div>

      {/* Grid de Proyectos */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center text-slate-400">
            <p className="text-sm">No se encontraron proyectos con los criterios de búsqueda actuales.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedFilter("ALL");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="mt-4 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 font-mono text-xs text-cyan-300 hover:bg-cyan-500/20"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          paginatedProjects.map((project, idx) => (
            <div
              key={project.id}
              className="animate-stage-enter flex"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <ProjectCard project={project} />
            </div>
          ))
        )}
      </div>

      {/* Paginación Profesional */}
      {filteredProjects.length > 0 && (
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 sm:p-5 backdrop-blur-md">
          {/* Contador de registros */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="flex size-2 rounded-full bg-cyan-400" />
            <span>
              Mostrando <strong className="text-white">{startCount}</strong> -{" "}
              <strong className="text-white">{endCount}</strong> de{" "}
              <strong className="text-cyan-300">{filteredProjects.length}</strong> proyectos
            </span>
          </div>

          {/* Navegación y Páginas */}
          <nav
            role="navigation"
            aria-label="Paginación de proyectos"
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={validCurrentPage === 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <ChevronLeft size={15} aria-hidden="true" />
              <span>Anterior</span>
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === validCurrentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`Página ${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex size-8 items-center justify-center rounded-lg font-mono text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isActive
                        ? "border border-cyan-400/60 bg-cyan-500/25 font-bold text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                        : "border border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-400/30 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {String(pageNum).padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={validCurrentPage === totalPages}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span>Siguiente</span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
