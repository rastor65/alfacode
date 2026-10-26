import { ArrowRight, Bell, BookOpen, CalendarDays, CircleCheck, Clock, FlaskConical, History, Info, Layers, ListChecks, ShieldCheck, Timer, UserRound, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { chip, dangerChip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { RISK_DETAIL } from "@/features/tracking/components/risk-chips";
import { OBSERVATION_KINDS, overdueLabel, plural, progressLabel, relativeTime, type ObservationList, type ProjectPanel } from "@/features/tracking/types";
import { STATUS_CHIP, STATUS_DOT } from "@/features/tasks/components/task-ui";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, type TaskStatus } from "@/features/tasks/types";
import { bogotaDay, formatDateTime, formatShortDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  METHODOLOGY_LABELS,
  PROJECT_ROLE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  daysSpan,
  formatCalendarDate,
  type ProjectDetail,
  type ProjectTabCounts,
} from "../types";
import { ProjectActions } from "./project-actions";
import { ProjectPageHeader } from "./project-page-header";

const linkClass = "font-medium text-hub-accent underline-offset-4 hover:underline";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]!.toUpperCase()).join("");

/**
 * I-27 (detalle): resumen del proyecto con las mismas cifras que los paneles (catalogo P-01 a P-11 y
 * G-02 a G-04). Los permisos ya los aplico el servidor; las acciones solo aparecen si estan permitidas.
 */
export function ProjectOverview({ project, panel, observations, counts }: { project: ProjectDetail; panel: ProjectPanel; observations: ObservationList; counts: ProjectTabCounts }) {
  const { tasks, signals, team, deliverables, events, sprints } = panel;
  const base = `/hub/proyectos/${project.id}`;
  const alerts = signals.risks.length > 0;
  const span = daysSpan(project.startDate, project.endDate, panel.today);
  const pastEnd = signals.risks.includes("past_end_date"), behind = signals.risks.includes("behind_schedule");
  const leaders = project.members.filter((member) => member.role === "leader");
  const members = [...project.members].sort((a, b) => Number(b.role === "leader") - Number(a.role === "leader") || a.fullName.localeCompare(b.fullName, "es"));

  return (
    <div className="flex flex-col gap-6">
      <ProjectPageHeader
        project={project}
        current="resumen"
        meta={
          <>
            {alerts && <span className={`${dangerChip} gap-1`}><Bell aria-hidden="true" className="size-3" />{plural(signals.risks.length, "alerta activa", "alertas activas")}</span>}
            {project.myRole && <span className={`${chip} gap-1 bg-hub-accent-soft text-hub-accent`}><ShieldCheck aria-hidden="true" className="size-3" />Tu rol: {PROJECT_ROLE_LABELS[project.myRole]}</span>}
            <span className="flex items-center gap-1.5 text-hub-muted">
              <Clock aria-hidden="true" className="size-3.5" />Datos al <time dateTime={panel.cutoff}>{formatDateTime(panel.cutoff)}</time> (Bogotá)
            </span>
          </>
        }
        actions={<ProjectActions project={project} />}
        counts={counts}
      />

      <dl aria-label="Indicadores del proyecto" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Avance de tareas"
          value={progressLabel(tasks)}
          hint={tasks.total ? `${tasks.done} de ${plural(tasks.total, "tarea terminada", "tareas terminadas")}` : "Aún no hay tareas registradas"}
          bar={tasks.progress}
          danger={behind}
        />
        <Kpi
          label="Tareas abiertas"
          value={tasks.pending}
          tag={tasks.overdue ? plural(tasks.overdue, "vencida", "vencidas") : undefined}
          hint={tasks.unassigned ? plural(tasks.unassigned, "tarea sin responsable", "tareas sin responsable") : `${tasks.dueSoon} vencen en 7 días`}
        />
        <Kpi
          label="Tiempo transcurrido"
          value={span ? `${span.elapsed} / ${span.total} días` : "Sin fechas"}
          tag={signals.elapsed === null ? undefined : `${signals.elapsed} %`}
          hint={pastEnd ? "Plazo vencido" : project.endDate ? `Fin: ${formatCalendarDate(project.endDate)}` : "Define las fechas para medir el plazo"}
          bar={signals.elapsed}
          danger={pastEnd}
        />
        <div className={`${panelCard} flex flex-col justify-between gap-3 p-4`}>
          <dt className={eyebrow}>Integrantes</dt>
          <dd className="flex flex-col gap-2">
            <span className="text-3xl font-semibold tabular-nums text-hub-text">{team.members}</span>
            <span className="flex items-center -space-x-2" aria-hidden="true">
              {members.slice(0, 5).map((member) => (
                <span key={member.userId} className="flex size-6 items-center justify-center rounded-full bg-hub-accent-soft text-[10px] font-bold text-hub-accent ring-2 ring-hub-bg">{initials(member.fullName)}</span>
              ))}
            </span>
            <span className="text-xs text-hub-muted">{plural(team.leaders, "líder", "líderes")} · {plural(team.members - team.leaders, "colaborador", "colaboradores")}</span>
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
          <section aria-labelledby="info-title" className={`${panelCard} flex flex-col gap-4 p-6`}>
            <h2 id="info-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text"><Info aria-hidden="true" className="size-5 text-hub-accent" />Información general</h2>
            <dl className="grid grid-cols-1 gap-4 rounded-lg bg-hub-subtle p-4 text-sm sm:grid-cols-2 md:grid-cols-3">
              <Field label="Tipo" value={PROJECT_TYPE_LABELS[project.type]} />
              <Field label="Metodología" value={METHODOLOGY_LABELS[project.methodology]} />
              <Field label="Estado" value={PROJECT_STATUS_LABELS[project.status]} />
              <Field label={leaders.length === 1 ? "Líder" : "Líderes"} value={leaders.length ? leaders.map((leader) => leader.fullName).join(", ") : "Sin líder asignado"} />
              <Field label="Periodo de ejecución" value={project.startDate || project.endDate ? `${formatCalendarDate(project.startDate) ?? "Sin definir"} – ${formatCalendarDate(project.endDate) ?? "Sin definir"}` : "Sin definir"} />
              <Field label="Integrantes" value={String(team.members)} />
            </dl>
            <div className="flex flex-col gap-1.5">
              <h3 className={eyebrow}>Descripción y alcance</h3>
              <div className="whitespace-pre-line break-words rounded-lg bg-hub-subtle p-4 text-sm leading-relaxed text-hub-soft">{project.description || "Este proyecto aún no tiene descripción."}</div>
            </div>
          </section>

          <section aria-labelledby="progress-title" className={`${panelCard} flex flex-col gap-4 p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 id="progress-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text"><Layers aria-hidden="true" className="size-5 text-hub-accent" />Progreso y avance</h2>
                <p className="text-xs text-hub-muted">Tareas por estado. El avance cuenta terminadas sobre el total: es una referencia de actividad, no una medida de calidad.</p>
              </div>
              <span className="font-mono text-sm font-bold text-hub-accent">{progressLabel(tasks)}</span>
            </div>
            {tasks.total ? (
              <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-hub-border p-0.5" aria-hidden="true">
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).filter((status) => tasks.byStatus[status] > 0).map((status) => (
                  <div key={status} className={cn("rounded-full", STATUS_DOT[status])} style={{ width: `${(tasks.byStatus[status] * 100) / tasks.total}%` }} title={`${TASK_STATUS_LABELS[status]}: ${tasks.byStatus[status]}`} />
                ))}
              </div>
            ) : <p className="rounded-lg border border-dashed border-hub-border px-4 py-5 text-center text-sm text-hub-muted">Aún no hay tareas registradas.</p>}
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => (
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

          {project.methodology === "agile" && (
            <section aria-labelledby="sprint-title" className={`${panelCard} flex flex-col gap-4 p-6`}>
              <h2 id="sprint-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text"><Timer aria-hidden="true" className="size-5 text-hub-accent" />{sprints?.active ? `Sprint activo · ${sprints.active.name}` : "Sprints"}</h2>
              {sprints?.active ? (
                <div className="flex flex-col gap-3 rounded-lg bg-hub-subtle p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-hub-muted">{formatCalendarDate(sprints.active.startDate)} – {formatCalendarDate(sprints.active.endDate)}</span>
                    {sprints.active.endDate < panel.today
                      ? <span className={`${dangerChip} gap-1`}>Venció {formatShortDay(sprints.active.endDate)} · sin cerrar</span>
                      : <span className={neutralChip}>Termina {formatShortDay(sprints.active.endDate)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-hub-text">Tareas del sprint</span>
                    <span className="font-mono font-bold text-hub-accent">{progressLabel(sprints.active.tasks)}{sprints.active.tasks.total > 0 && ` · ${sprints.active.tasks.done}/${sprints.active.tasks.total}`}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-hub-border" aria-hidden="true">
                    {sprints.active.tasks.progress !== null && <div className="h-full rounded-full bg-hub-chart" style={{ width: `${sprints.active.tasks.progress}%` }} />}
                  </div>
                  <Link href={`${base}/sprints`} className={`self-end text-sm ${linkClass}`}>Ver tablero del sprint →</Link>
                </div>
              ) : <p className="text-sm text-hub-muted">No hay un sprint activo. <Link href={`${base}/sprints`} className={linkClass}>Planificar o iniciar un sprint</Link></p>}
              {sprints?.lastCompleted && (
                <p className="text-xs text-hub-muted">
                  Último sprint cerrado: <strong className="text-hub-soft">{sprints.lastCompleted.name}</strong> · {sprints.lastCompleted.tasks.done} de {plural(sprints.lastCompleted.tasks.total, "tarea terminada", "tareas terminadas")} al cierre.
                </p>
              )}
            </section>
          )}

          <section aria-labelledby="deliverables-title" className={`${panelCard} flex flex-col gap-3 p-6`}>
            <h2 id="deliverables-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text"><BookOpen aria-hidden="true" className="size-5 text-hub-accent" />Resultados, productos y actividades</h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Shortcut icon={FlaskConical} label="Resultados de investigación" value={deliverables.researchResults} href={`${base}/investigacion`} />
              <Shortcut icon={BookOpen} label="Productos académicos" value={deliverables.products.total} href={`${base}/produccion`} />
              <Shortcut icon={CalendarDays} label="Actividades" value={events.total} href={`${base}/actividades`} />
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
          <section aria-labelledby="alerts-title" className={`${panelCard} flex flex-col gap-3 p-6`}>
            <h2 id="alerts-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text">
              <Bell aria-hidden="true" className={cn("size-5", alerts ? "text-hub-field-error" : "text-hub-accent")} />Alertas del proyecto
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
            <p className="text-[11px] text-hub-muted">Son alertas operativas del proyecto; no evalúan al equipo.</p>
          </section>

          <section aria-labelledby="team-title" className={`${panelCard} flex flex-col gap-3 p-6`}>
            <h2 id="team-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text"><Users aria-hidden="true" className="size-5 text-hub-accent" />Equipo del proyecto</h2>
            {members.length ? (
              <ul className="flex flex-col divide-y divide-hub-border">
                {members.slice(0, 8).map((member) => (
                  <li key={member.userId} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hub-accent-soft text-xs font-bold text-hub-accent">{initials(member.fullName)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-hub-text">{member.fullName}</p>
                        {member.email && <p className="truncate text-[11px] text-hub-muted">{member.email}</p>}
                      </div>
                    </div>
                    <span className={cn(member.role === "leader" ? `${chip} bg-hub-accent-soft text-hub-accent` : neutralChip, "shrink-0")}>{PROJECT_ROLE_LABELS[member.role]}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-hub-muted">Sin integrantes. Asigna al menos un líder antes de activar el proyecto.</p>}
            {members.length > 8 && <p className="text-[11px] text-hub-muted">Se muestran 8 de {members.length} integrantes.</p>}
          </section>

          <section aria-labelledby="mine-title" className={`${panelCard} flex flex-col gap-3 p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="mine-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text"><ListChecks aria-hidden="true" className="size-5 text-hub-accent" />Mis tareas pendientes</h2>
              <span className={neutralChip}>{plural(panel.myTasks.open, "asignada", "asignadas")}</span>
            </div>
            {panel.myTasks.items.length ? (
              <ul className="flex flex-col gap-1.5">
                {panel.myTasks.items.map((task) => {
                  const late = task.dueDate !== null && task.dueDate < panel.today;
                  return (
                    <li key={task.id} className="flex flex-col gap-1 rounded-lg bg-hub-subtle p-2.5 transition-colors hover:bg-hub-hover">
                      <Link href={`${base}/tareas`} className="break-words text-sm font-medium leading-tight text-hub-text hover:underline">{task.title}</Link>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={late ? "font-medium text-hub-field-error" : "text-hub-muted"}>
                          {task.dueDate ? (late ? `Venció: ${overdueLabel(task.dueDate, panel.today).toLowerCase()}` : `Para ${formatShortDay(task.dueDate)}`) : "Sin fecha límite"}
                        </span>
                        <span className="text-hub-muted">· Prioridad {TASK_PRIORITY_LABELS[task.priority].toLowerCase()}</span>
                        <span className={STATUS_CHIP[task.status]}>{TASK_STATUS_LABELS[task.status]}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-hub-muted">No tienes tareas abiertas en este proyecto.</p>}
            {panel.myTasks.open > panel.myTasks.items.length && <p className="text-[11px] text-hub-muted">Se muestran {panel.myTasks.items.length} de {panel.myTasks.open}, las de fecha límite más próxima.</p>}
            <Link href={`${base}/tareas`} className={`text-sm ${linkClass}`}>Ir al tablero de tareas →</Link>
          </section>

          <section aria-labelledby="activity-title" className={`${panelCard} flex flex-col gap-3 p-6`}>
            <h2 id="activity-title" className="flex items-center gap-2 text-lg font-semibold text-hub-text"><History aria-hidden="true" className="size-5 text-hub-accent" />Última actividad</h2>
            <p className="flex items-center gap-1.5 text-xs text-hub-muted">
              <UserRound aria-hidden="true" className="size-3.5" />
              {signals.lastActivityAt
                ? <>Último movimiento del proyecto: <time dateTime={signals.lastActivityAt} title={formatDateTime(signals.lastActivityAt)}>{relativeTime(signals.lastActivityAt, panel.cutoff) ?? formatShortDay(bogotaDay(signals.lastActivityAt))}</time></>
                : "Sin registros de actividad."}
            </p>
            {observations.items.length ? (
              <ul className="flex flex-col gap-2">
                {observations.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="rounded-lg bg-hub-subtle p-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-hub-muted">
                      <span className={neutralChip}>{OBSERVATION_KINDS[item.kind]}</span>
                      <span>{item.author.fullName ?? "Autor no disponible"} · <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>{relativeTime(item.createdAt, panel.cutoff) ?? formatShortDay(bogotaDay(item.createdAt))}</time></span>
                    </div>
                    <p className="mt-1.5 line-clamp-3 whitespace-pre-line break-words text-sm text-hub-text">{item.body}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-hub-muted">Aún no hay observaciones de seguimiento.</p>}
            <Link href={`${base}/seguimiento`} className={`inline-flex items-center gap-1 text-sm ${linkClass}`}>Ver seguimiento y observaciones<ArrowRight aria-hidden="true" className="size-4" /></Link>
          </section>
        </div>
      </div>
    </div>
  );
}

export function riskCopy(risk: ProjectPanel["signals"]["risks"][number], panel: ProjectPanel, project: ProjectDetail): [string, string] {
  switch (risk) {
    case "overdue_tasks":
      return [plural(panel.tasks.overdue, "tarea vencida", "tareas vencidas"), "Tareas abiertas con fecha límite anterior a hoy."];
    case "past_end_date":
      return ["Fecha de fin superada", `El proyecto sigue activo después de su fecha de fin (${formatCalendarDate(project.endDate)}).`];
    case "inactive":
      return ["Sin actividad en 14 días", "No se modificaron tareas, observaciones ni datos del proyecto en las últimas dos semanas."];
    case "behind_schedule": {
      const time = panel.signals.elapsed ?? 0, done = panel.tasks.progress ?? 0;
      return [`Avance retrasado: Δ${time - done} pts`, `${time} % del tiempo transcurrido frente a ${done} % de tareas terminadas.`];
    }
  }
}

function Kpi({ label, value, tag, hint, bar, danger }: { label: string; value: number | string; tag?: string; hint: string; bar?: number | null; danger?: boolean }) {
  return (
    <div className={`${panelCard} flex flex-col justify-between gap-3 p-4`}>
      <dt className={eyebrow}>{label}</dt>
      <dd className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums text-hub-text">{value}</span>
          {tag && <span className={cn(danger || /vencida/.test(tag) ? dangerChip : neutralChip, "font-mono")}>{tag}</span>}
        </span>
        <span className="text-xs text-hub-muted">{hint}</span>
        {bar !== undefined && (
          <span aria-hidden="true" className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-hub-border">
            {bar !== null && <span className={cn("block h-full rounded-full", danger ? "bg-hub-field-error" : "bg-hub-chart")} style={{ width: `${bar}%` }} />}
          </span>
        )}
      </dd>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className={eyebrow}>{label}</dt>
      <dd className="break-words font-medium text-hub-text">{value}</dd>
    </div>
  );
}

function Shortcut({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: number; href: string }) {
  return (
    <li className="relative flex items-center gap-3 rounded-lg bg-hub-subtle p-3 transition-colors hover:bg-hub-hover">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent"><Icon className="size-4.5" /></span>
      <div className="min-w-0">
        <Link href={href} className="block truncate text-[13px] font-medium text-hub-text after:absolute after:inset-0">{label}</Link>
        <p className="font-mono text-lg font-bold text-hub-text">{value}</p>
      </div>
    </li>
  );
}
