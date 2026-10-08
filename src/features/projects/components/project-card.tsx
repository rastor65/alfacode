import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/domain";

export function ProjectCard({ project }: { project: Project }) {
  const isCompleted = project.status.toLowerCase().includes("completado") || project.status.toLowerCase().includes("produccion");

  return (
    <article className="glass-card-interactive group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-200">
      {/* Top accent glow line */}
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#469eb4] to-transparent opacity-80"
        aria-hidden="true"
      />

      {/* Hover radial spotlight */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#469eb4]/10 blur-3xl transition duration-300 group-hover:bg-[#469eb4]/25"
        aria-hidden="true"
      />

      <div>
        {/* Status pill & Arrow */}
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-950/40 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            <span
              className={`size-1.5 rounded-full ${
                isCompleted ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"
              }`}
              aria-hidden="true"
            />
            {project.status}
          </span>
          <ArrowUpRight
            className="shrink-0 text-cyan-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-cyan-200"
            size={20}
            aria-hidden="true"
          />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-xl font-bold tracking-tight text-white transition group-hover:text-cyan-100">
          <Link
            href={`/proyectos/${project.slug}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm"
          >
            <span className="absolute inset-0" aria-hidden="true" />
            {project.name}
          </Link>
        </h3>

        {/* Summary */}
        <p className="mt-2.5 text-sm leading-relaxed text-slate-300 line-clamp-3">
          {project.summary}
        </p>
      </div>

      {/* Technologies tags */}
      <div className="mt-6 flex flex-wrap gap-1.5 border-t border-white/5 pt-4">
        {project.technologies.slice(0, 4).map((technology) => (
          <Badge
            key={technology.id}
            className="border-cyan-400/20 bg-cyan-950/30 text-cyan-200/90 text-[11px] font-mono px-2 py-0.5 hover:border-cyan-400/40"
          >
            {technology.name}
          </Badge>
        ))}
        {project.technologies.length > 4 && (
          <span className="text-[11px] text-slate-400 self-center">
            +{project.technologies.length - 4}
          </span>
        )}
      </div>
    </article>
  );
}
