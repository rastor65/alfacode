import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { chip, dangerChip, neutralChip } from "@/features/tracking/components/dashboard-ui";
import { cn } from "@/lib/utils";

import { METHODOLOGY_LABELS, PROJECT_ROLE_LABELS, PROJECT_STATUS_LABELS, type ProjectDetail, type ProjectTabCounts } from "../types";

export type ProjectSection = "resumen" | "tareas" | "sprints" | "investigacion" | "documentos" | "produccion" | "actividades" | "seguimiento";

type ProjectHeaderProps = {
  project: ProjectDetail;
  eyebrow: string;
  current: Exclude<ProjectSection, "resumen">;
};

/**
 * Pestañas del proyecto; la de sprints solo existe en modalidad agil (F2-20). Las de investigacion y
 * documentos existen en todos: la ficha es opcional (F3-03). `counts` agrega la cifra de cada pestaña
 * (conteos, sprint activo, alertas), se vea o no la pestaña activa.
 */
export function ProjectTabs({ project, current, counts = {} }: { project: Pick<ProjectDetail, "id" | "methodology">; current: ProjectSection; counts?: ProjectTabCounts }) {
  const count = (value: number | undefined) => (value ? <span className={`${neutralChip} rounded-full font-mono`}>{value}</span> : undefined);
  const badges: Partial<Record<ProjectSection, React.ReactNode>> = {
    tareas: count(counts.tasks),
    sprints: counts.activeSprint ? <span className={`${chip} max-w-32 truncate rounded-full bg-hub-accent-soft text-hub-accent`}>{counts.activeSprint}</span> : undefined,
    investigacion: count(counts.research),
    documentos: count(counts.documents),
    produccion: count(counts.production),
    actividades: counts.upcoming ? <span className={`${chip} rounded-full bg-hub-accent-soft text-hub-accent`}>{counts.upcoming} próx.</span> : undefined,
    seguimiento: counts.alerts ? (
      <span className={`${dangerChip} gap-1 rounded-full font-mono`}>
        <Bell aria-hidden="true" className="size-3" />
        {counts.alerts}
        <span className="sr-only"> {counts.alerts === 1 ? "alerta activa" : "alertas activas"}</span>
      </span>
    ) : undefined,
  };

  const tabs: { key: ProjectSection; label: string; href: string }[] = [
    { key: "resumen", label: "Resumen", href: `/hub/proyectos/${project.id}` },
    { key: "tareas", label: project.methodology === "agile" ? "Tablero y backlog" : "Tareas", href: `/hub/proyectos/${project.id}/tareas` },
    ...(project.methodology === "agile" ? [{ key: "sprints" as const, label: "Sprints", href: `/hub/proyectos/${project.id}/sprints` }] : []),
    { key: "investigacion", label: "Investigación", href: `/hub/proyectos/${project.id}/investigacion` },
    { key: "documentos", label: "Documentos", href: `/hub/proyectos/${project.id}/documentos` },
    { key: "produccion", label: "Producción", href: `/hub/proyectos/${project.id}/produccion` },
    { key: "actividades", label: "Actividades", href: `/hub/proyectos/${project.id}/actividades` },
    { key: "seguimiento", label: "Seguimiento", href: `/hub/proyectos/${project.id}/seguimiento` },
  ];

  return (
    <nav aria-label="Secciones del proyecto" className="relative -mx-1 overflow-x-auto px-1">
      <ul className="flex min-w-max gap-1 border-b border-hub-border">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <Link
              href={tab.href}
              aria-current={tab.key === current ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                tab.key === current ? "border-cyan-500 font-medium text-hub-text" : "border-transparent text-hub-muted hover:text-hub-text",
              )}
            >
              {tab.label}
              {badges[tab.key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Encabezado de las vistas de un proyecto que no son el resumen. */
export function ProjectHeader({ project, eyebrow, current }: ProjectHeaderProps) {
  return (
    <header>
      <Link href="/hub/proyectos" className="inline-flex items-center gap-1.5 text-sm text-hub-accent underline-offset-4 hover:underline">
        <ArrowLeft size={14} aria-hidden="true" />
        Proyectos
      </Link>
      <p className="mt-4 text-sm font-medium text-hub-accent">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text sm:text-3xl">{project.name}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{PROJECT_STATUS_LABELS[project.status]}</Badge>
        <Badge>{METHODOLOGY_LABELS[project.methodology]}</Badge>
        {project.myRole && <Badge>Tu rol: {PROJECT_ROLE_LABELS[project.myRole]}</Badge>}
      </div>
      <div className="mt-5">
        <ProjectTabs project={project} current={current} />
      </div>
    </header>
  );
}
