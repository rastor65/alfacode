import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { METHODOLOGY_LABELS, PROJECT_ROLE_LABELS, PROJECT_STATUS_LABELS, type ProjectDetail } from "../types";

type ProjectHeaderProps = {
  project: ProjectDetail;
  eyebrow: string;
  current: "tareas" | "sprints" | "investigacion";
};

/**
 * Encabezado de las vistas de un proyecto; la pestana de sprints solo existe en modalidad agil
 * (F2-20). La de investigacion existe en todos: la ficha es opcional (F3-03).
 */
export function ProjectHeader({ project, eyebrow, current }: ProjectHeaderProps) {
  const tabs = [
    { key: "tareas", label: project.methodology === "agile" ? "Tablero y backlog" : "Tareas", href: `/hub/proyectos/${project.id}/tareas` },
    ...(project.methodology === "agile" ? [{ key: "sprints", label: "Sprints", href: `/hub/proyectos/${project.id}/sprints` }] : []),
    { key: "investigacion", label: "Investigación", href: `/hub/proyectos/${project.id}/investigacion` },
  ];

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
      {tabs.length > 1 && (
        <nav aria-label="Secciones del proyecto" className="mt-5 flex gap-1 border-b border-hub-border">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={tab.key === current ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                tab.key === current
                  ? "border-cyan-500 font-medium text-hub-text"
                  : "border-transparent text-hub-muted hover:text-hub-text",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
