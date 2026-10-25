import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { METHODOLOGY_LABELS, PROJECT_ROLE_LABELS, PROJECT_STATUS_LABELS, type ProjectDetail } from "../types";

export type ProjectSection = "resumen" | "tareas" | "sprints" | "investigacion" | "documentos" | "produccion" | "actividades" | "seguimiento";

type ProjectHeaderProps = {
  project: ProjectDetail;
  eyebrow: string;
  current: Exclude<ProjectSection, "resumen">;
};

/**
 * Pestañas del proyecto; la de sprints solo existe en modalidad agil (F2-20). Las de investigacion y
 * documentos existen en todos: la ficha es opcional (F3-03). `badges` agrega datos junto a cada pestaña.
 */
export function ProjectTabs({
  project,
  current,
  badges = {},
  onTabChange,
}: {
  project: Pick<ProjectDetail, "id" | "methodology">;
  current: ProjectSection;
  badges?: Partial<Record<ProjectSection, React.ReactNode>>;
  onTabChange?: (key: ProjectSection) => void;
}) {
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
    <nav aria-label="Secciones del proyecto" className="-mx-1 overflow-x-auto px-1">
      <ul role={onTabChange ? "tablist" : undefined} className="flex min-w-max gap-1 border-b border-hub-border">
        {tabs.map((tab) => {
          const isActive = tab.key === current;
          return (
            <li key={tab.key} role={onTabChange ? "presentation" : undefined}>
              {onTabChange ? (
                <button
                  type="button"
                  role="tab"
                  id={`tab-${tab.key}`}
                  aria-controls={`panel-${tab.key}`}
                  aria-selected={isActive}
                  onClick={() => onTabChange(tab.key)}
                  className={cn(
                    "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                    isActive
                      ? "border-cyan-500 font-semibold text-hub-text shadow-[0_1px_0_0_rgb(6,182,212)]"
                      : "border-transparent text-hub-muted hover:border-hub-border hover:text-hub-text",
                  )}
                >
                  {tab.label}
                  {badges[tab.key]}
                </button>
              ) : (
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                    isActive ? "border-cyan-500 font-medium text-hub-text" : "border-transparent text-hub-muted hover:text-hub-text",
                  )}
                >
                  {tab.label}
                  {badges[tab.key]}
                </Link>
              )}
            </li>
          );
        })}
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
