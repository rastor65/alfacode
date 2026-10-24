import { Layers, Timer } from "lucide-react";
import Link from "next/link";

import { formatCalendarDate } from "@/features/projects/types";
import { SPRINT_STATUS_LABELS, type BoardScope, type SprintSummary } from "@/features/sprints/types";
import { dangerChip, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { plural, progressLabel } from "@/features/tracking/types";
import { cn } from "@/lib/utils";

import { TASK_STATUSES, TASK_STATUS_LABELS, type ProjectProgress } from "../types";
import { STATUS_DOT } from "./task-ui";

type ScopeBannerProps = {
  projectId: string;
  scope: BoardScope;
  sprint?: SprintSummary;
  progress: ProjectProgress;
  overdue: number;
  unassigned: number;
  today: string;
};

/**
 * Resumen de lo que se esta viendo: el sprint (fechas, meta, estado), el backlog o todas las tareas, con su
 * avance (tareas terminadas sobre el total, nunca 0 % ni 100 % sin tareas) y la distribucion por estado.
 */
export function ScopeBanner({ projectId, scope, sprint, progress, overdue, unassigned, today }: ScopeBannerProps) {
  // Redondeo igual al de los paneles; sin tareas no hay porcentaje.
  const percent = progress.total ? Math.round((progress.done * 100) / progress.total) : null;
  const lateSprint = sprint?.status === "active" && sprint.endDate < today;
  const title = sprint ? sprint.name : scope.kind === "backlog" ? "Backlog (tareas sin sprint)" : scope.kind === "all" ? "Todas las tareas" : "Tareas del proyecto";
  const Icon = sprint ? Timer : Layers;

  return (
    <section aria-label="Resumen de la vista" className={cn(panelCard, "relative flex flex-col justify-between gap-4 overflow-hidden p-4 lg:flex-row lg:items-center")}>
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1.5", lateSprint ? "bg-hub-field-error" : "bg-hub-chart")} />
      <div className="flex min-w-0 flex-col gap-1.5 pl-2">
        <div className="flex flex-wrap items-center gap-2">
          <Icon aria-hidden="true" className="size-5 text-hub-accent" />
          <h2 className="break-words text-lg font-semibold text-hub-text">{title}</h2>
          {sprint && <span className={neutralChip}>{SPRINT_STATUS_LABELS[sprint.status]}</span>}
          {lateSprint && <span className={dangerChip}>Venció · sin cerrar</span>}
        </div>
        {sprint && (
          <p className="text-[13px] text-hub-muted">
            {formatCalendarDate(sprint.startDate)} – {formatCalendarDate(sprint.endDate)}
            {sprint.goal ? ` · Meta: ${sprint.goal}` : ""}
          </p>
        )}
        {sprint && (
          <Link href={`/hub/proyectos/${projectId}/sprints`} className="text-sm font-medium text-hub-accent underline-offset-4 hover:underline">
            {sprint.status === "active" ? "Gestionar o completar el sprint →" : "Ir a sprints →"}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg bg-hub-subtle px-4 py-3">
        <div className="flex min-w-32 flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-hub-text">{progress.total ? progressLabel({ progress: percent }) : "Sin tareas"}</span>
            {progress.total > 0 && <span className="text-xs text-hub-muted">{progress.done} de {plural(progress.total, "tarea terminada", "tareas terminadas")}</span>}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-hub-border" aria-hidden="true">
            {percent !== null && <div className="h-full rounded-full bg-hub-chart" style={{ width: `${percent}%` }} />}
          </div>
        </div>
        <dl className="flex items-center gap-4 text-center">
          {TASK_STATUSES.map((status) => (
            <div key={status} className="flex flex-col">
              <dd className="font-mono text-base font-bold text-hub-text">{progress.byStatus[status]}</dd>
              <dt className="flex items-center gap-1 text-[11px] text-hub-muted"><span aria-hidden="true" className={cn("size-2 rounded-full", STATUS_DOT[status])} />{TASK_STATUS_LABELS[status]}</dt>
            </div>
          ))}
          <div className="h-8 w-px bg-hub-border" aria-hidden="true" />
          <div className="flex flex-col">
            <dd className={cn("font-mono text-base font-bold", overdue ? "text-hub-field-error" : "text-hub-text")}>{overdue}</dd>
            <dt className={cn("text-[11px]", overdue ? "text-hub-field-error" : "text-hub-muted")}>Vencidas</dt>
          </div>
          <div className="flex flex-col">
            <dd className="font-mono text-base font-bold text-hub-text">{unassigned}</dd>
            <dt className="text-[11px] text-hub-muted">Sin resp.</dt>
          </div>
        </dl>
      </div>
    </section>
  );
}
