import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { neutralChip, STATUS_CHIP } from "@/features/tracking/components/dashboard-ui";
import { cn } from "@/lib/utils";

import { METHODOLOGY_LABELS, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, type ProjectDetail } from "../types";
import { ProjectTabs, type ProjectSection } from "./project-header";

type ProjectPageHeaderProps = {
  project: Pick<ProjectDetail, "id" | "name" | "status" | "methodology" | "type">;
  current: ProjectSection;
  /** Seccion actual en la ruta; sin ella, el nombre del proyecto es el ultimo tramo. */
  crumb?: string;
  /** Datos junto al titulo (alertas, rol, corte...). */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  badges?: Partial<Record<ProjectSection, React.ReactNode>>;
};

/** Encabezado comun de las vistas de un proyecto (I-27): ruta, titulo con chips, datos, acciones y pestañas. */
export function ProjectPageHeader({ project, current, crumb, meta, actions, badges }: ProjectPageHeaderProps) {
  return (
    <>
      <header className="flex flex-col gap-4">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-sm">
          <Link href="/hub/proyectos" className="inline-flex items-center gap-1 text-hub-accent underline-offset-4 hover:underline">
            <ArrowLeft aria-hidden="true" className="size-4" />Volver a Proyectos
          </Link>
          <span aria-hidden="true" className="text-hub-muted">/</span>
          {crumb ? (
            <>
              <Link href={`/hub/proyectos/${project.id}`} className="max-w-60 truncate text-hub-muted underline-offset-4 hover:underline">{project.name}</Link>
              <span aria-hidden="true" className="text-hub-muted">/</span>
              <span className="font-semibold text-hub-text" aria-current="page">{crumb}</span>
            </>
          ) : (
            <span className="truncate font-semibold text-hub-text" aria-current="page">{project.name}</span>
          )}
        </nav>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-semibold tracking-tight text-hub-text">{project.name}</h1>
              <span className={cn(STATUS_CHIP[project.status], "rounded-full")}>{PROJECT_STATUS_LABELS[project.status]}</span>
              <span className={neutralChip}>{METHODOLOGY_LABELS[project.methodology]}</span>
              <span className={neutralChip}>{PROJECT_TYPE_LABELS[project.type]}</span>
            </div>
            {meta && <div className="flex flex-wrap items-center gap-2 text-xs">{meta}</div>}
          </div>
          {actions}
        </div>
      </header>
      <ProjectTabs project={project} current={current} badges={badges} />
    </>
  );
}
