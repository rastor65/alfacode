"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { ProjectCard } from "@/features/projects/components/project-card";
import type { Project } from "@/types/domain";

type HomeFeaturedProjectsSectionProps = {
  projects: Project[];
};

const PAGE_SIZE = 3;

export function HomeFeaturedProjectsSection({
  projects,
}: HomeFeaturedProjectsSectionProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.ceil(projects.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentProjects = projects.slice(startIndex, startIndex + PAGE_SIZE);

  const startCount = startIndex + 1;
  const endCount = Math.min(startIndex + PAGE_SIZE, projects.length);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-24">
      {/* Ambient glow with parallax drift */}
      <div
        className="pointer-events-none absolute right-10 top-1/2 size-80 -translate-y-1/2 rounded-full bg-[#469eb4]/10 blur-3xl animate-parallax-float-delayed"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header bar con telemetría y controles de navegación */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-site-eyebrow">
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Controles de paginación de cabecera */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-1 font-mono text-xs text-slate-300">
                <span className="px-2 text-cyan-300 font-semibold">
                  {String(currentPage).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                </span>

                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  aria-label="Página anterior de proyectos destacados"
                  className="flex size-7 items-center justify-center rounded text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente de proyectos destacados"
                  className="flex size-7 items-center justify-center rounded text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            <ButtonLink
              href="/proyectos"
              variant="secondary"
              className="gap-2 shrink-0 self-start sm:self-auto"
            >
              Catálogo completo
              <ArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>

        {/* Grid de Proyectos Paginados */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentProjects.map((project, idx) => (
            <div
              key={project.id}
              className={`flex animate-stage-enter`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        {/* Barra de Paginación Profesional Inferior */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-md">
            {/* Contador de registros */}
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
              <span className="flex size-2 rounded-full bg-cyan-400" />
              <span>
                Mostrando <strong className="text-white">{startCount}</strong> -{" "}
                <strong className="text-white">{endCount}</strong> de{" "}
                <strong className="text-cyan-300">{projects.length}</strong> proyectos verificados
              </span>
            </div>

            {/* Selector de Páginas Numérico */}
            <nav
              role="navigation"
              aria-label="Paginación de proyectos destacados"
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <ChevronLeft size={14} aria-hidden="true" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      aria-label={`Ir a página ${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex size-8 items-center justify-center rounded-md font-mono text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
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
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <span>Siguiente</span>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
}
