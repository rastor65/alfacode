"use client";

import { ArrowRight, CalendarDays, Eye, ListChecks, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { formatCalendarDate } from "@/features/projects/types";
import { STATUS_CHIP, STATUS_DOT } from "@/features/tasks/components/task-ui";
import { TASK_STATUSES, TASK_STATUS_LABELS, describeProgress } from "@/features/tasks/types";
import { chip, dangerChip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { plural } from "@/features/tracking/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { SPRINT_STATUS_LABELS, activeSprint, deliveredRate, sprintTiming, type SprintDetail, type SprintSummary } from "../types";
import { SprintDetailContent } from "./sprint-detail";

type SprintsBoardProps = {
  projectId: string;
  sprints: SprintSummary[];
  /** Detalle del sprint activo (sus tareas); null si no hay uno activo. */
  activeDetail: SprintDetail | null;
  /** Tareas del backlog (sin sprint). */
  backlogTotal: number;
  /** Dia calendario de hoy en Bogota (`YYYY-MM-DD`). */
  today: string;
};

const actionClass =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hub-border bg-hub-panel px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

const byStart = (a: SprintSummary, b: SprintSummary) => a.startDate.localeCompare(b.startDate);

function timeLabel(remaining: number) {
  if (remaining > 0) return plural(remaining, "día restante", "días restantes");
  if (remaining === 0) return "Termina hoy";
  return `Vencido hace ${plural(-remaining, "día", "días")}`;
}

function Kpi({ label, value, hint, bar, danger }: { label: string; value: string | number; hint: string; bar?: number | null; danger?: boolean }) {
  return (
    <div className={`${panelCard} flex min-w-0 flex-col gap-3 p-4`}>
      <dt className={eyebrow}>{label}</dt>
      <dd className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-3xl font-semibold tabular-nums text-hub-text">{value}</span>
        <span className={cn("text-xs", danger ? "font-medium text-hub-danger-text" : "text-hub-muted")}>{hint}</span>
        {bar !== undefined && (
          <span aria-hidden="true" className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-hub-border">
            {bar !== null && <span className={cn("block h-full rounded-full", danger ? "bg-hub-field-error" : "bg-hub-chart")} style={{ width: `${bar}%` }} />}
          </span>
        )}
      </dd>
    </div>
  );
}

/** Barra segmentada por estado de tarea, con los conteos en texto. */
function StatusBar({ progress }: { progress: SprintSummary["progress"] }) {
  const { label } = describeProgress(progress);
  if (progress.total === 0) return <p className="text-sm text-hub-muted">Sin tareas</p>;
  return (
    <div className="flex flex-col gap-2">
      <div
        role="img"
        aria-label={`${label}: ${TASK_STATUSES.map((status) => `${TASK_STATUS_LABELS[status]} ${progress.byStatus[status]}`).join(", ")}`}
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-hub-border"
      >
        {TASK_STATUSES.filter((status) => progress.byStatus[status] > 0).map((status) => (
          <span key={status} className={STATUS_DOT[status]} style={{ width: `${(progress.byStatus[status] * 100) / progress.total}%` }} />
        ))}
      </div>
      <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-hub-muted">
        {TASK_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
            {TASK_STATUS_LABELS[status]} <span className="font-mono font-medium text-hub-text">{progress.byStatus[status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vista de sprints de un proyecto agil: activo, planificados, avance por sprint e historial (F2-20). */
export function SprintsBoard({ projectId, sprints, activeDetail, backlogTotal, today }: SprintsBoardProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<SprintSummary | null>(null);
  const [detail, setDetail] = useState<SprintDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  // Evita que una respuesta tardia pise el detalle de otro sprint abierto despues.
  const currentId = useRef<string | null>(null);

  async function open(sprint: SprintSummary) {
    currentId.current = sprint.id;
    setSelected(sprint);
    setDetail(null);
    setDetailError(null);

    try {
      const loaded = await apiRequest<SprintDetail>(`/projects/${projectId}/sprints/${sprint.id}`);
      if (currentId.current === sprint.id) setDetail(loaded);
    } catch (caught) {
      if (currentId.current === sprint.id) setDetailError(describeError(caught));
    }
  }

  function close() {
    currentId.current = null;
    setSelected(null);
  }

  const active = activeSprint(sprints);
  const planned = sprints.filter((sprint) => sprint.status === "planned").sort(byStart);
  const finished = sprints
    .filter((sprint) => sprint.status === "completed" || sprint.status === "cancelled")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const delivery = deliveredRate(sprints);
  const timing = active ? sprintTiming(active, today) : null;
  const overdue = timing !== null && timing.remaining < 0;
  const activeProgress = active ? describeProgress(active.progress) : null;
  const chartRows = sprints.filter((sprint) => sprint.status !== "cancelled").sort(byStart).slice(-8);
  const chartMax = Math.max(1, ...chartRows.map((sprint) => sprint.progress.total));
  // Lo mas cercano a terminar primero: en revision, en progreso y por hacer.
  const pendingTasks = activeDetail
    ? activeDetail.tasks.filter((task) => task.status !== "done").sort((x, y) => TASK_STATUSES.indexOf(y.status) - TASK_STATUSES.indexOf(x.status))
    : [];

  return (
    <>
      <dl aria-label="Indicadores de sprints" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Sprint activo"
          value={active?.name ?? "Ninguno"}
          hint={timing ? timeLabel(timing.remaining) : planned.length > 0 ? plural(planned.length, "planificado", "planificados") : "Sin sprints en curso"}
          bar={timing ? Math.round((timing.elapsed * 100) / timing.total) : undefined}
          danger={overdue}
        />
        <Kpi
          label="Avance del sprint"
          value={activeProgress?.percent == null ? "—" : `${activeProgress.percent} %`}
          hint={activeProgress ? activeProgress.label : "Sin sprint activo"}
          bar={activeProgress ? activeProgress.percent : undefined}
        />
        <Kpi
          label="Tareas entregadas"
          value={delivery.percent === null ? "—" : `${delivery.percent} %`}
          hint={delivery.closed === 0 ? "Sin sprints cerrados" : `En ${plural(delivery.closed, "sprint cerrado", "sprints cerrados")}`}
        />
        <Kpi label="Backlog" value={backlogTotal} hint={backlogTotal === 1 ? "tarea sin sprint" : "tareas sin sprint"} />
      </dl>

      {sprints.length === 0 && (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">Aún no hay sprints en este proyecto.</p>
      )}

      {active && timing && (
        <section aria-labelledby="sprint-activo" className={`${panelCard} flex min-w-0 flex-col gap-5 p-5`}>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-col gap-2">
              <p className={eyebrow}>Sprint activo</p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="sprint-activo" className="break-words text-xl font-semibold tracking-tight text-hub-text">
                  {active.name}
                </h2>
                <span className={cn(chip, "bg-hub-accent-soft text-hub-accent")}>{SPRINT_STATUS_LABELS.active}</span>
                <span className={overdue ? dangerChip : neutralChip}>{timeLabel(timing.remaining)}</span>
              </div>
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-hub-muted">
                <CalendarDays aria-hidden="true" className="size-4" />
                {formatCalendarDate(active.startDate)} – {formatCalendarDate(active.endDate)}
                <span aria-hidden="true">·</span>
                Día {timing.elapsed} de {timing.total}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void open(active)} aria-haspopup="dialog" className={actionClass}>
                <Eye aria-hidden="true" className="size-4" />
                Gestionar
              </button>
              <Link href={`/hub/proyectos/${projectId}/tareas`} className={actionClass}>
                Ver tablero
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>

          {active.goal && <p className="max-w-4xl whitespace-pre-line rounded-lg bg-hub-subtle p-3 text-sm text-hub-text">{active.goal}</p>}

          <StatusBar progress={active.progress} />

          {pendingTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className={eyebrow}>Por terminar · {pendingTasks.length}</h3>
              <ul className="divide-y divide-hub-border rounded-lg border border-hub-border">
                {pendingTasks.slice(0, 6).map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-hub-text">{task.title}</p>
                      <p className="truncate text-xs text-hub-muted">{task.assignee?.fullName ?? "Sin responsable"}</p>
                    </div>
                    <span className={cn(STATUS_CHIP[task.status], "shrink-0")}>{TASK_STATUS_LABELS[task.status]}</span>
                  </li>
                ))}
              </ul>
              {pendingTasks.length > 6 && (
                <button
                  type="button"
                  onClick={() => void open(active)}
                  aria-haspopup="dialog"
                  className="self-start text-xs font-medium text-hub-accent underline-offset-4 hover:underline"
                >
                  Ver las {pendingTasks.length - 6} restantes
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {(planned.length > 0 || chartRows.length > 0) && (
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <section aria-labelledby="sprints-planificados" className={`${panelCard} flex min-w-0 flex-col gap-3 p-5`}>
            <h2 id="sprints-planificados" className={eyebrow}>
              Planificados · {planned.length}
            </h2>
            {planned.length === 0 ? (
              <p className="text-sm text-hub-muted">No hay sprints planificados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {planned.map((sprint) => (
                  <li key={sprint.id}>
                    <button
                      type="button"
                      onClick={() => void open(sprint)}
                      aria-haspopup="dialog"
                      className="flex w-full flex-col gap-1.5 rounded-lg bg-hub-subtle p-3 text-left transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-hub-text">{sprint.name}</span>
                        <span className={`${neutralChip} shrink-0`}>
                          <ListChecks aria-hidden="true" className="size-3" />
                          {sprint.progress.total}
                        </span>
                      </span>
                      <span className="text-xs text-hub-muted">
                        {formatCalendarDate(sprint.startDate)} – {formatCalendarDate(sprint.endDate)}
                      </span>
                      {sprint.goal && <span className="line-clamp-2 text-xs text-hub-soft">{sprint.goal}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="tareas-por-sprint" className={`${panelCard} flex min-w-0 flex-col gap-3 p-5`}>
            <h2 id="tareas-por-sprint" className={eyebrow}>
              Tareas por sprint
            </h2>
            {chartRows.length === 0 ? (
              <p className="text-sm text-hub-muted">Sin datos.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {chartRows.map((sprint) => (
                  <li key={sprint.id} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm">
                    <span className="truncate text-hub-text">{sprint.name}</span>
                    <span aria-hidden="true" className="block h-2">
                      <span className="block h-2 overflow-hidden rounded-full bg-hub-border" style={{ width: `${(sprint.progress.total * 100) / chartMax}%` }}>
                        <span className="block h-full rounded-full bg-hub-chart" style={{ width: sprint.progress.total ? `${(sprint.progress.done * 100) / sprint.progress.total}%` : "0%" }} />
                      </span>
                    </span>
                    <span className="font-mono text-xs tabular-nums text-hub-muted">
                      <span className="font-medium text-hub-text">{sprint.progress.done}</span> / {sprint.progress.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {finished.length > 0 && (
        <section aria-labelledby="historial-sprints" className={`${panelCard} flex min-w-0 flex-col gap-3 p-5`}>
          <h2 id="historial-sprints" className={eyebrow}>
            Historial · {finished.length}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-hub-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Sprint</th>
                  <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">Periodo</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Hechas</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Estado</th>
                  <th scope="col" className="w-10 py-2">
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border">
                {finished.map((sprint) => (
                  <tr key={sprint.id}>
                    <td className="max-w-40 py-2.5 pr-4 sm:max-w-64">
                      <span className="block truncate font-medium text-hub-text">{sprint.name}</span>
                      <span className="block text-xs text-hub-muted sm:hidden">
                        {formatCalendarDate(sprint.startDate)} – {formatCalendarDate(sprint.endDate)}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap py-2.5 pr-4 text-hub-muted sm:table-cell">
                      {formatCalendarDate(sprint.startDate)} – {formatCalendarDate(sprint.endDate)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-hub-text">
                      {sprint.progress.done} / {sprint.progress.total}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={sprint.status === "completed" ? `${chip} bg-hub-success-bg text-hub-success-text` : neutralChip}>{SPRINT_STATUS_LABELS[sprint.status]}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => void open(sprint)}
                        aria-haspopup="dialog"
                        aria-label={`Abrir ${sprint.name}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                      >
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={selected !== null} onClose={close} title={detail?.name ?? selected?.name ?? "Sprint"} size="lg">
        {selected &&
          (detailError ? (
            <Alert tone="error">{detailError}</Alert>
          ) : !detail ? (
            <p className="flex items-center gap-2 text-sm text-hub-muted" role="status">
              <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Cargando…
            </p>
          ) : (
            <SprintDetailContent
              key={detail.id}
              projectId={projectId}
              sprint={detail}
              onChanged={(updated) => {
                setDetail(updated);
                // La vista (servidor) refleja estado, progreso y tareas actualizados.
                router.refresh();
              }}
            />
          ))}
      </Modal>
    </>
  );
}
