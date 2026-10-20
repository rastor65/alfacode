import Link from "next/link";
import { ArrowUpRight, ExternalLink, GitBranch, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/domain";

const statusConfig: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  RESEARCH: {
    label: "Investigación",
    dotClass: "bg-cyan-400 animate-pulse",
    badgeClass: "border-cyan-400/30 bg-cyan-950/40 text-cyan-200",
  },
  DEVELOPMENT: {
    label: "En Desarrollo",
    dotClass: "bg-sky-400 animate-pulse",
    badgeClass: "border-sky-400/30 bg-sky-950/40 text-sky-200",
  },
  VALIDATION: {
    label: "Validación",
    dotClass: "bg-amber-400 animate-pulse",
    badgeClass: "border-amber-400/30 bg-amber-950/40 text-amber-200",
  },
  COMPLETED: {
    label: "Producción",
    dotClass: "bg-emerald-400",
    badgeClass: "border-emerald-400/30 bg-emerald-950/40 text-emerald-200",
  },
  PROPOSAL: {
    label: "Propuesta",
    dotClass: "bg-slate-400",
    badgeClass: "border-slate-500/30 bg-slate-900/40 text-slate-300",
  },
  ARCHIVED: {
    label: "Archivado",
    dotClass: "bg-slate-500",
    badgeClass: "border-slate-600/30 bg-slate-900/40 text-slate-400",
  },
};

export function ProjectCard({ project }: { project: Project }) {
  const statusMeta = statusConfig[project.status] ?? {
    label: project.status,
    dotClass: "bg-cyan-400",
    badgeClass: "border-cyan-400/30 bg-cyan-950/40 text-cyan-200",
  };

  const trl = project.trl ?? "TRL 4";
  const primaryLine = project.researchLines?.[0]?.name;
  const developersText =
    project.developers && project.developers.length > 0
      ? project.developers.join(", ")
      : null;

  return (
    <article className="glass-card-interactive group relative flex w-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 p-6 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_12px_40px_rgba(6,182,212,0.12)]">
      {/* Top architectural accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent opacity-75 group-hover:opacity-100 transition-opacity"
        aria-hidden="true"
      />

      {/* Subtle background coordinate watermark */}
      <div
        className="pointer-events-none absolute right-4 top-3 font-mono text-[9px] uppercase tracking-widest text-slate-500/40"
        aria-hidden="true"
      >
        SYS_ID::{project.id.slice(0, 8)}
      </div>

      <div>
        {/* Header bar: TRL + Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* TRL pill con tipografía técnica */}
            <span className="inline-flex items-center rounded border border-cyan-400/35 bg-cyan-950/50 px-2 py-0.5 font-mono text-[11px] font-bold tracking-tight text-cyan-300">
              {trl}
            </span>

            {/* Status pill con dot luminoso */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusMeta.badgeClass}`}
            >
              <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} aria-hidden="true" />
              {statusMeta.label}
            </span>
          </div>

          <ArrowUpRight
            className="shrink-0 text-cyan-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-cyan-200"
            size={18}
            aria-hidden="true"
          />
        </div>

        {/* Línea de investigación eyebrow */}
        {primaryLine && (
          <div className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-site-eyebrow">
            <GitBranch size={12} className="text-cyan-400" aria-hidden="true" />
            <span className="truncate">{primaryLine}</span>
          </div>
        )}

        {/* Nombre del Proyecto */}
        <h3 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-white transition group-hover:text-cyan-100 line-clamp-2">
          <Link
            href={`/proyectos/${project.slug}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm"
          >
            <span className="absolute inset-0" aria-hidden="true" />
            {project.name}
          </Link>
        </h3>

        {/* Resumen del problema / solución */}
        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-300 line-clamp-2">
          {project.summary}
        </p>

        {/* Investigadores / Desarrolladores */}
        {developersText && (
          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-400">
            <Users size={13} className="shrink-0 text-slate-500" aria-hidden="true" />
            <span className="font-mono text-[11px] truncate">
              <span className="text-slate-500 uppercase tracking-wider">Equipo:</span> {developersText}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Tecnologías & Enlaces */}
      <div className="relative z-10 mt-5 border-t border-white/5 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Tags de Tecnologías */}
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 3).map((technology) => (
              <Badge
                key={technology.id}
                className="border-cyan-400/20 bg-cyan-950/30 text-cyan-200/90 text-[11px] font-mono px-2 py-0.5 hover:border-cyan-400/40"
              >
                {technology.name}
              </Badge>
            ))}
            {project.technologies.length > 3 && (
              <span className="self-center font-mono text-[11px] text-slate-400">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>

          {/* Enlace externo si existe */}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visitar sitio de ${project.name}`}
              className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Demo</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
