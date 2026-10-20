"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  Code2,
  ExternalLink,
  FileCode,
  FileText,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import type { Publication, PublicationType } from "@/types/domain";
import { PublicationsEmptyState } from "./publications-empty-state";

type PublicPublicationsPageProps = {
  publications?: Publication[];
};

export function PublicPublicationsPage({
  publications = [],
}: PublicPublicationsPageProps) {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  if (!publications || publications.length === 0) {
    return <PublicationsEmptyState />;
  }

  const filteredPublications = publications.filter((pub) => {
    const matchesType = selectedType === "ALL" || pub.type === selectedType;
    const matchesSearch =
      searchQuery.trim() === "" ||
      pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesType && matchesSearch;
  });

  const getTypeIcon = (type: PublicationType) => {
    switch (type) {
      case "ARTICLE":
        return BookOpen;
      case "CONFERENCE":
        return Award;
      case "SOFTWARE_REGISTRY":
        return FileCode;
      case "TECHNICAL_REPORT":
        return FileText;
      default:
        return FileText;
    }
  };

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-[0.24em] text-cyan-200">
          <BookOpen size={14} className="text-cyan-400" aria-hidden="true" />
          Producción Científica &amp; Técnica
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Publicaciones
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          Artículos científicos, ponencias y registros de software desarrollados en el semillero AlfaCode.
        </p>
      </div>

      {/* Barra de Filtros y Busqueda */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filtro por Tipo */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "ALL", label: "Todas" },
            { id: "ARTICLE", label: "Artículos" },
            { id: "CONFERENCE", label: "Ponencias" },
            { id: "SOFTWARE_REGISTRY", label: "Software Registrado" },
            { id: "TECHNICAL_REPORT", label: "Reportes Técnicos" },
          ].map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
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

        {/* Buscador */}
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
            placeholder="Buscar por título, tema o revista..."
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-400 backdrop-blur-md transition-colors focus:border-cyan-400/60 focus:bg-slate-900/90 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>
      </div>

      {/* Lista de Publicaciones */}
      <div className="mt-8 space-y-6">
        {filteredPublications.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center text-slate-400">
            <p className="text-sm">No se encontraron publicaciones con los criterios seleccionados.</p>
          </div>
        ) : (
          filteredPublications.map((pub, idx) => {
            const Icon = getTypeIcon(pub.type);

            return (
              <article
                key={pub.id}
                className={`scroll-reveal stagger-${(idx % 5) + 1} glass-card-interactive group relative rounded-xl p-6 sm:p-8`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/50 text-cyan-200">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-300">
                      {pub.typeLabel}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-300">
                    <Calendar size={13} className="text-cyan-400" aria-hidden="true" />
                    {pub.year}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold tracking-tight text-white transition-colors group-hover:text-cyan-100 sm:text-2xl">
                  {pub.title}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Users size={14} className="text-cyan-400" aria-hidden="true" />
                    {pub.authors.join(", ")}
                  </span>
                  <span>·</span>
                  <span className="text-cyan-200/90">{pub.venue}</span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-300 line-clamp-3">
                  {pub.abstract}
                </p>

                {/* Tags y Enlace */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {pub.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-mono text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:text-white"
                    >
                      <span>Ver Recurso / Repositorio</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
