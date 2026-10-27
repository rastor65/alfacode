import { Bell, BookOpen, CalendarDays, CircleCheck, FlaskConical, Layers, Timer } from "lucide-react";
import Link from "next/link";

import { PRODUCT_STATUSES } from "@/features/academic/types";
import { EVENT_STATUSES } from "@/features/events/types";
import { riskCopy } from "@/features/projects/components/project-overview";
import { daysSpan, formatCalendarDate, type ProjectDetail } from "@/features/projects/types";
import { STATUS_DOT } from "@/features/tasks/components/task-ui";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/features/tasks/types";
import { formatDateTime, formatShortDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Observations } from "./observations";
import { RISK_DETAIL } from "./risk-chips";
import { dangerChip, eyebrow, neutralChip, panelCard } from "./dashboard-ui";
import { plural, progressLabel, relativeTime, type ObservationList, type ProjectPanel } from "../types";

const TASK_STATUSES = Object.keys(TASK_STATUS_LABELS) as TaskStatus[];

function Kpi({ label, value, tag, hint, bar, danger, text = false }: { label: string; value: number | string; tag?: string; hint: string; bar?: number | null; danger?: boolean; text?: boolean }) {
  return (
    <div className={`${panelCard} flex min-w-0 flex-col gap-3 p-4`}>
      <dt className={eyebrow}>{label}</dt>
      <dd className="flex min-w-0 flex-col gap-1.5">
        <span className="flex flex-wrap items-baseline gap-2">
          <span className={cn("font-semibold tabular-nums text-hub-text", text ? "text-2xl" : "text-3xl")}>{value}</span>
          {tag && <span className={cn(dangerChip, "font-mono")}>{tag}</span>}
        </span>
        <span className="line-clamp-2 text-xs text-hub-muted">{hint}</span>
        {bar !== undefined && (
          <span aria-hidden="true" className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-hub-border">
            {bar !== null && <span className={cn("block h-full rounded-full", danger ? "bg-hub-field-error" : "bg-hub-chart")} style={{ width: `${bar}%` }} />}
          </span>
        )}
      </dd>
    </div>
  );
}

/**
 * Barras horizontales de una sola serie (conteo por categoria). Etiqueta y valor son texto; la barra
 * es decorativa. Se listan las categorias en cero para no ocultar la ausencia de datos.
 */
function BarList<K extends string>({ title, labels, counts, href }: { title: string; labels: Record<K, string>; counts: Record<K, number>; href?: string }) {
  const keys = Object.keys(labels) as K[];
  const max = Math.max(0, ...keys.map((key) => counts[key] ?? 0));

  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-3 rounded-lg bg-hub-subtle p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className={eyebrow}>{title}</h3>
        {href && (
          <Link href={href} className="text-xs font-medium text-hub-accent underline-offset-4 hover:underline">
            Ver<span className="sr-only">: {title}</span>
          </Link>
        )}
      </div>
      {max === 0 ? (
        <p className="text-sm text-hub-muted">Sin datos registrados.</p>
      ) : (
        <dl className="flex flex-col gap-2.5 text-sm">
          {keys.map((key) => {
            const value = counts[key] ?? 0;
            return (
              <div key={key} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
                <dt className={cn("truncate", value ? "text-hub-text" : "text-hub-muted")} title={labels[key]}>
                  {labels[key]}
                </dt>
                <dd aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-hub-border/50">
                  {value > 0 && <span className="block h-full rounded-full bg-hub-chart" style={{ width: `${(value * 100) / max}%` }} />}
                </dd>
                <dd className="font-mono text-xs tabular-nums font-medium text-hub-text">{value}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}

function SprintBlock({ title, sprint, today, note }: { title: string; sprint: NonNullable<ProjectPanel["sprints"]>["active"]; today: string; note?: string }) {
  if (!sprint) return null;
  const late = sprint.endDate < today;

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-hub-subtle p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={eyebrow}>{title}</p>
          <p className="break-words font-medium text-hub-text">{sprint.name}</p>
        </div>
        {note && <span className={neutralChip}>{note}</span>}
        {!note && <span className={late ? dangerChip : neutralChip}>{late ? `Venció ${formatShortDay(sprint.endDate)}` : `Termina ${formatShortDay(sprint.endDate)}`}</span>}
      </div>
      <p className="text-xs text-hub-muted">
        {formatCalendarDate(sprint.startDate)} – {formatCalendarDate(sprint.endDate)}
      </p>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-hub-soft">Tareas del sprint</span>
        <span className="font-mono font-semibold text-hub-accent">
          {progressLabel(sprint.tasks)}
          {sprint.tasks.total > 0 && ` · ${sprint.tasks.done}/${sprint.tasks.total}`}
        </span>
      </div>
      <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-hub-border">
        {sprint.tasks.progress !== null && <span className="block h-full rounded-full bg-hub-chart" style={{ width: `${sprint.tasks.progress}%` }} />}
      </span>
    </div>
  );
}

/** Seguimiento del proyecto (F6-03): avance operativo, sprints, entregables, alertas y observaciones. */
export function ProjectTracking({ project, panel, observations }: { project: ProjectDetail; panel: ProjectPanel; observations: ObservationList }) {
  const { tasks, sprints, deliverables, events, signals, cutoff, today } = panel;
  const base = `/hub/proyectos/${project.id}`;
  const span = daysSpan(project.startDate, project.endDate, today);
  const pastEnd = signals.risks.includes("past_end_date");
  const lastActivity = signals.lastActivityAt ? (relativeTime(signals.lastActivityAt, cutoff) ?? formatDateTime(signals.lastActivityAt)) : "Sin actividad";
  const alerts = signals.risks.length > 0;

  return (
    <>
      <p className="-mb-2 text-xs text-hub-muted">
        Datos al <time dateTime={cutoff}>{formatDateTime(cutoff)}</time> (Bogotá)
      </p>

      <dl aria-label="Indicadores de seguimiento" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Avance de tareas"
          value={progressLabel(tasks)}
          hint={tasks.total ? `${tasks.done} de ${plural(tasks.total, "tarea terminada", "tareas terminadas")}` : "Aún no hay tareas registradas"}
          bar={tasks.progress}
          danger={signals.risks.includes("behind_schedule")}
        />
        <Kpi
          label="Tareas pendientes"
          value={tasks.pending}
          tag={tasks.overdue ? plural(tasks.overdue, "vencida", "vencidas") : undefined}
          hint={tasks.unassigned ? plural(tasks.unassigned, "tarea sin responsable", "tareas sin responsable") : `${tasks.dueSoon} vencen en 7 días`}
        />
        <Kpi
          label="Plazo"
          value={span ? `${span.elapsed} / ${span.total} días` : "Sin fechas"}
          tag={pastEnd ? "Vencido" : undefined}
          hint={project.endDate ? `Fin planificado: ${formatCalendarDate(project.endDate)}` : "Define las fechas para medir el plazo"}
          bar={signals.elapsed}
          danger={pastEnd}
        />
        <Kpi text label="Última actividad" value={lastActivity} hint={alerts ? plural(signals.risks.length, "alerta activa", "alertas activas") : "Sin alertas"} />
      </dl>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <section aria-labelledby="tareas-title" className={`${panelCard} flex min-w-0 flex-col gap-4 p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 id="tareas-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text">
                  <Layers aria-hidden="true" className="size-5 text-hub-accent" />
                  Tareas por estado
                </h2>
                <p className="text-xs text-hub-muted">El avance cuenta terminadas sobre el total: es una referencia de actividad, no mide la calidad.</p>
              </div>
              <Link href={`${base}/tareas`} className="text-sm font-medium text-hub-accent underline-offset-4 hover:underline">
                Ver tareas
              </Link>
            </div>
            {tasks.total > 0 ? (
              <div role="img" aria-label={TASK_STATUSES.map((status) => `${TASK_STATUS_LABELS[status]} ${tasks.byStatus[status]}`).join(", ")} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-hub-border p-0.5">
                {TASK_STATUSES.filter((status) => tasks.byStatus[status] > 0).map((status) => (
                  <span key={status} className={cn("rounded-full", STATUS_DOT[status])} style={{ width: `${(tasks.byStatus[status] * 100) / tasks.total}%` }} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-hub-border px-4 py-5 text-center text-sm text-hub-muted">Aún no hay tareas registradas.</p>
            )}
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TASK_STATUSES.map((status) => (
                <li key={status} className="flex items-center gap-2 rounded-lg bg-hub-subtle p-2">
                  <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-full", STATUS_DOT[status])} />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] text-hub-muted">{TASK_STATUS_LABELS[status]}</span>
                    <span className="block font-mono text-lg font-bold text-hub-text">{tasks.byStatus[status]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {sprints && (
            <section aria-labelledby="sprints-title" className={`${panelCard} flex min-w-0 flex-col gap-4 p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="sprints-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text">
                  <Timer aria-hidden="true" className="size-5 text-hub-accent" />
                  Sprints
                </h2>
                <Link href={`${base}/sprints`} className="text-sm font-medium text-hub-accent underline-offset-4 hover:underline">
                  Ver sprints
                </Link>
              </div>
              {sprints.active || sprints.lastCompleted ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SprintBlock title="Sprint activo" sprint={sprints.active} today={today} />
                  <SprintBlock title="Último sprint cerrado" sprint={sprints.lastCompleted} today={today} note="Registro al cierre" />
                </div>
              ) : (
                <p className="text-sm text-hub-muted">No hay un sprint activo ni cerrado.</p>
              )}
              {sprints.active === null && sprints.lastCompleted && <p className="text-xs text-hub-muted">No hay un sprint activo.</p>}
            </section>
          )}

          <section aria-labelledby="entregables-title" className={`${panelCard} flex min-w-0 flex-col gap-4 p-6`}>
            <h2 id="entregables-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text">
              <BookOpen aria-hidden="true" className="size-5 text-hub-accent" />
              Entregables y actividades
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Count icon={FlaskConical} label="Resultados de investigación" value={deliverables.researchResults} href={`${base}/investigacion`} />
              <Count icon={BookOpen} label="Productos académicos" value={deliverables.products.total} href={`${base}/produccion`} />
              <Count icon={CalendarDays} label="Actividades" value={events.total} href={`${base}/actividades`} />
            </ul>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BarList title="Productos por estado" labels={PRODUCT_STATUSES} counts={deliverables.products.byStatus} />
              <BarList title="Actividades por estado" labels={EVENT_STATUSES} counts={events.byStatus} />
            </div>
          </section>
        </div>

        <section aria-labelledby="alertas-title" className={`${panelCard} flex min-w-0 flex-col gap-3 p-6 lg:col-span-4`}>
          <h2 id="alertas-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text">
            <Bell aria-hidden="true" className={cn("size-5", alerts ? "text-hub-field-error" : "text-hub-accent")} />
            Alertas
          </h2>
          {alerts ? (
            <ul className="flex flex-col gap-2">
              {signals.risks.map((risk) => {
                const Icon = RISK_DETAIL[risk].icon;
                const [title, detail] = riskCopy(risk, panel, project);
                return (
                  <li key={risk} className="flex items-start gap-2.5 rounded-lg bg-hub-danger-bg p-3">
                    <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-hub-field-error" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-hub-text">{title}</p>
                      <p className="text-[13px] text-hub-muted">{detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="flex items-start gap-2 rounded-lg bg-hub-subtle p-3 text-sm text-hub-muted">
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-hub-accent" />
              {project.status === "active" ? "Sin alertas: el proyecto no tiene tareas vencidas ni retrasos." : "Las alertas de riesgo solo se calculan en proyectos activos."}
            </p>
          )}
        </section>
      </div>

      <Observations projectId={project.id} initial={observations} />
    </>
  );
}

function Count({ icon: Icon, label, value, href }: { icon: typeof BookOpen; label: string; value: number; href: string }) {
  return (
    <li className="relative flex items-center gap-3 rounded-lg bg-hub-subtle p-3 transition-colors hover:bg-hub-hover">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <Link href={href} className="block truncate text-[13px] font-medium text-hub-text after:absolute after:inset-0">
          {label}
        </Link>
        <p className="font-mono text-lg font-bold text-hub-text">{value}</p>
      </div>
    </li>
  );
}
