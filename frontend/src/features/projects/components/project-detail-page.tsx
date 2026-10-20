import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  ExternalLink,
  Layers,
  Sparkles,
  Tag,
  UserCheck,
} from "lucide-react";

import { PublicPageShell } from "@/components/layout/public-page-shell";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/domain";

type ProjectDetailPageProps = {
  project: Project;
};

const STATUS_LABELS: Record<string, string> = {
  PROPOSAL: "Propuesta de I+D",
  RESEARCH: "Investigación Activa",
  DESIGN: "Diseño & Arquitectura",
  DEVELOPMENT: "En Desarrollo Activo",
  VALIDATION: "Validación & Pruebas",
  COMPLETED: "Transferido & Completado",
  ARCHIVED: "Archivo Histórico",
};

export function ProjectDetailPage({ project }: ProjectDetailPageProps) {
  const statusLabel = STATUS_LABELS[project.status] ?? project.status;

  return (
    <PublicPageShell maxWidth="default" withInteractiveBackground>
      {/* Breadcrumb Navigation */}
      <nav
        className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-8"
        aria-label="Ruta de navegación"
      >
        <Link
          href="/"
          className="hover:text-cyan-300 transition-colors"
        >
          Inicio
        </Link>
        <ChevronRight size={13} className="text-slate-600" aria-hidden="true" />
        <Link
          href="/proyectos"
          className="hover:text-cyan-300 transition-colors"
        >
          Proyectos
        </Link>
        <ChevronRight size={13} className="text-slate-600" aria-hidden="true" />
        <span className="text-cyan-400 font-medium truncate max-w-xs sm:max-w-md">
          {project.name}
        </span>
      </nav>

      {/* Header Capsule with Status & Metadata */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
          {statusLabel}
        </span>

        {project.trl && (
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-400/30 bg-teal-950/40 px-3 py-1 text-xs font-mono font-semibold text-teal-300">
            <Layers size={13} aria-hidden="true" />
            {project.trl}
          </span>
        )}

        <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-400">
          <Tag size={13} className="text-cyan-400/80" aria-hidden="true" />
          AlfaCode Lab
        </span>
      </div>

      {/* Title & Summary */}
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl max-w-4xl">
        {project.name}
      </h1>

      <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg max-w-3xl">
        {project.summary}
      </p>

      {/* Interactive Actions & Direct Links Bar */}
      <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-cyan-500/15 py-5">
        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-full border border-cyan-400/50 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span>Visitar Plataforma en Vivo</span>
            <ExternalLink size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono text-slate-400">
            <span className="size-2 rounded-full bg-amber-400/80" aria-hidden="true" />
            Despliegue en entorno local de laboratorio
          </span>
        )}

        <Link
          href="/proyectos"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-400/30 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Ver más proyectos
        </Link>
      </div>

      {/* Project Team & Contributors Strip */}
      {project.developers && project.developers.length > 0 && (
        <div className="mt-8 rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-slate-950/30 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(70,158,180,0.25)]">
                <Code2 size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300">
                  Equipo Desarrollador &amp; Autores
                </p>
                <p className="text-xs text-slate-400">
                  Investigadores e ingenieros de software a cargo del proyecto
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {project.developers.map((dev) => (
                <span
                  key={dev}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-950/50 px-3 py-1.5 text-xs font-semibold text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                >
                  <UserCheck size={14} className="text-cyan-400" aria-hidden="true" />
                  {dev}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Narrative Cards Grid */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Card: Problematica */}
        <section className="glass-card-interactive rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg backdrop-blur-xl transition duration-300 hover:border-cyan-400/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex size-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-950/40 text-rose-300">
              <AlertCircle size={17} aria-hidden="true" />
            </span>
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Problemática Central
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            {project.problemStatement}
          </p>
        </section>

        {/* Card: Objetivo */}
        <section className="glass-card-interactive rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg backdrop-blur-xl transition duration-300 hover:border-cyan-400/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex size-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
              <CheckCircle2 size={17} aria-hidden="true" />
            </span>
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Objetivo Estratégico
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            {project.objective}
          </p>
        </section>
      </div>

      {/* Card: Solucion Tecnologica */}
      <section className="mt-6 glass-card-interactive rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg backdrop-blur-xl transition duration-300 hover:border-cyan-400/30">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex size-8 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/40 text-teal-300">
            <Sparkles size={17} aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold uppercase tracking-wider text-white">
            Solución Tecnológica Implementada
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          {project.solution}
        </p>
      </section>

      {/* Technologies & Research Lines Strip */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Tecnologias */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-cyan-400" aria-hidden="true" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Stack Tecnológico
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((technology) => (
              <Badge
                key={technology.id}
                className="border-cyan-400/20 bg-cyan-950/40 text-cyan-200"
              >
                {technology.name}
              </Badge>
            ))}
          </div>
        </section>

        {/* Líneas de Investigación */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-cyan-400" aria-hidden="true" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Líneas de Investigación
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.researchLines.map((line) => (
              <span
                key={line.id}
                className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300 font-medium"
              >
                {line.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
