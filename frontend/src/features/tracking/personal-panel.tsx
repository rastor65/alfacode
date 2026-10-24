import {
  AlertCircle, CalendarClock, CalendarDays, CalendarX, ChevronRight, CircleCheck, Circle, ClipboardList, Clock, FileText,
  FolderKanban, History, LayoutGrid, ListChecks, PieChart, Presentation, ShieldCheck, TriangleAlert, UserX, type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { PRODUCT_STATUSES } from "@/features/academic/types";
import { EVENT_MODES } from "@/features/events/types";
import { PROJECT_STATUS_LABELS } from "@/features/projects/types";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/features/tasks/types";
import { formatDateTime, formatShortDay as shortDay } from "@/lib/format";

import { Donut } from "./components/charts";
import { chip, dangerChip, eyebrow, neutralChip, panelCard, STATUS_CHIP } from "./components/dashboard-ui";
import { RefreshButton } from "./components/refresh-button";
import { addDays, OBSERVATION_KINDS, overdueLabel, plural, relativeTime, splitDeadlines, type PersonalPanel, type ProjectCard } from "./types";

type TaskItem = PersonalPanel["tasks"]["items"][number];
const TASK_CHIP: Record<TaskStatus, string> = {
  todo: neutralChip,
  in_progress: `${chip} bg-hub-accent-soft text-hub-accent`,
  in_review: `${chip} bg-hub-info-bg text-hub-info-text`,
  done: `${chip} bg-hub-success-bg text-hub-success-text`,
};
const bogota = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", ...options });
const dayOf = bogota({ day: "2-digit" }), monthOf = bogota({ month: "short" }), timeOf = bogota({ timeStyle: "short" });

/**
 * F6-04 e I-26 (M-07 a M-10): solo datos propios, ya filtrados por la visibilidad de cada modulo en el
 * backend. Con `roleLabel` muestra la cabecera "Mi panel"; sin ella se usa dentro de "Mi trabajo".
 */
export function PersonalPanelView({ data, roleLabel }: { data: PersonalPanel; roleLabel?: string }) {
  const soon = addDays(data.today, 7);
  const { overdue, dueSoon } = splitDeadlines(data.tasks.items, data.today, soon);
  const later = data.tasks.items.filter((task) => !overdue.includes(task) && !dueSoon.includes(task));
  const { byStatus } = data.products;
  const collaborating = data.projects.total - data.projects.leading;

  return (
    <div className="flex flex-col gap-6">
      {roleLabel ? (
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Mi panel</h1>
              <span className={`${chip} gap-1.5 rounded-full bg-hub-accent-soft text-hub-accent`}><ShieldCheck aria-hidden="true" className="size-3.5" />{roleLabel}</span>
            </div>
            <Cutoff value={data.cutoff} />
          </div>
          <div className="self-start md:self-auto"><RefreshButton /></div>
        </header>
      ) : <Cutoff value={data.cutoff} />}

      <dl aria-label="Tus indicadores" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Mis proyectos" icon={FolderKanban} value={data.projects.total} hint={`${data.projects.leading} liderados · ${collaborating} colab.`} href="/hub/proyectos" />
        <Kpi label="Tareas abiertas" icon={ListChecks} value={data.tasks.open} tag={data.tasks.overdue ? plural(data.tasks.overdue, "vencida", "vencidas") : undefined} hint="Asignadas a ti" />
        <Kpi label="Próx. 7 días" icon={CalendarClock} value={data.tasks.dueSoon} hint={`Vencen hasta el ${shortDay(soon)}`} />
        <Kpi label="Terminadas" icon={CircleCheck} value={data.tasks.done} hint="Tareas asignadas a ti" />
        <Kpi label="Asistencias" icon={Presentation} value={data.events.attended} hint="Actividades con asistencia" href="/hub/actividades" />
        <Kpi label="Productos" icon={FileText} value={data.products.total} hint={`${byStatus.published} publ. · ${byStatus.submitted + byStatus.accepted} en evaluación`} href="/hub/produccion" />
      </dl>

      <section aria-labelledby="my-tasks" className={`${panelCard} flex flex-col gap-4 p-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <ClipboardList aria-hidden="true" className="size-5 text-hub-accent" />
          <h2 id="my-tasks" className="text-lg font-semibold text-hub-text">Mis tareas</h2>
          <span className={neutralChip}>{plural(data.tasks.open, "activa", "activas")}</span>
        </div>
        {data.tasks.items.length ? (
          <>
            <TaskGroup title="Vencidas" dot="bg-hub-field-error" titleClass="text-hub-field-error" tag={dangerChip} tasks={overdue}>
              {(task) => <TaskRow key={task.id} task={task} tone="alert" when={<><CalendarX aria-hidden="true" className="size-3.5" />{shortDay(task.dueDate!)} ({overdueLabel(task.dueDate!, data.today)})</>} />}
            </TaskGroup>
            <TaskGroup title="Esta semana (próximos 7 días)" dot="bg-hub-chart" titleClass="text-hub-accent" tag={`${chip} bg-hub-accent-soft text-hub-accent`} tasks={dueSoon}>
              {(task) => <TaskRow key={task.id} task={task} when={<><CalendarDays aria-hidden="true" className="size-3.5" />{task.dueDate === data.today ? "Hoy" : shortDay(task.dueDate!)}</>} />}
            </TaskGroup>
            <TaskGroup title="Más adelante" dot="bg-hub-muted" titleClass="text-hub-muted" tag={neutralChip} tasks={later} grid>
              {(task) => (
                <li key={task.id} className="flex items-center justify-between gap-2 rounded-lg bg-hub-subtle p-2 transition-colors hover:bg-hub-hover">
                  <span className="flex min-w-0 items-center gap-2">
                    <Clock aria-hidden="true" className="size-3.5 shrink-0 text-hub-muted" />
                    <Link href={`/hub/proyectos/${task.projectId}/tareas`} className="truncate text-[13px] text-hub-text hover:underline" title={`${task.title} · ${task.projectName}`}>{task.title}</Link>
                  </span>
                  <span className="shrink-0 text-[11px] text-hub-muted">{task.dueDate ? shortDay(task.dueDate) : "Sin fecha"} · {TASK_STATUS_LABELS[task.status]}</span>
                </li>
              )}
            </TaskGroup>
            {data.tasks.open > data.tasks.items.length && <p className="text-[11px] text-hub-muted">Se muestran {data.tasks.items.length} de {data.tasks.open}, las de fecha límite más próxima.</p>}
          </>
        ) : <p className="rounded-xl border border-dashed border-hub-border px-4 py-6 text-center text-sm text-hub-muted">No tienes tareas abiertas.</p>}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`${panelCard} flex flex-col p-6 lg:col-span-5`}>
          <CardHeader icon={PieChart} title="Mis tareas por estado" aside={<span className="text-[11px] text-hub-muted">{data.tasks.open + data.tasks.done} totales</span>} />
          <Donut labels={TASK_STATUS_LABELS} counts={data.tasks.byStatus} empty="Aún no tienes tareas asignadas." centerLabel="registros" showPercent />
        </div>
        <div className={`${panelCard} flex flex-col p-6 lg:col-span-7`}>
          <CardHeader icon={CalendarDays} title="Próximas actividades" aside={<Link href="/hub/actividades" className="text-[11px] text-hub-accent hover:underline">Ver agenda completa</Link>} />
          {data.events.upcoming.length ? (
            <ul className="mt-2 flex flex-col gap-2">
              {data.events.upcoming.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 rounded-lg bg-hub-subtle p-2 transition-colors hover:bg-hub-hover">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex shrink-0 flex-col items-center justify-center rounded bg-hub-accent-soft px-2.5 py-1 text-center">
                      <span className="text-[11px] font-bold uppercase text-hub-accent">{monthOf.format(new Date(event.startsAt)).replace(".", "")}</span>
                      <span className="text-lg font-bold leading-tight text-hub-text">{dayOf.format(new Date(event.startsAt))}</span>
                    </span>
                    <div className="min-w-0">
                      <Link href={event.projectId ? `/hub/proyectos/${event.projectId}/actividades` : "/hub/actividades"} className="block truncate text-sm font-medium text-hub-text hover:underline">{event.title}</Link>
                      <p className="flex items-center gap-1 truncate text-[11px] text-hub-muted"><Clock aria-hidden="true" className="size-3" /><time dateTime={event.startsAt}>{timeOf.format(new Date(event.startsAt))}</time> · {EVENT_MODES[event.mode as keyof typeof EVENT_MODES] ?? event.mode}</p>
                    </div>
                  </div>
                  <span className={event.projectName ? `${chip} max-w-40 shrink-0 truncate bg-hub-accent-soft text-hub-accent` : `${neutralChip} shrink-0`}>{event.projectName ?? "Institucional"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-hub-muted">No tienes inscripciones en actividades programadas.</p>}
        </div>
      </section>

      <section aria-labelledby="my-projects" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="my-projects" className="flex items-center gap-2 text-lg font-semibold text-hub-text"><LayoutGrid aria-hidden="true" className="size-5 text-hub-accent" />Mis proyectos</h2>
          <span className="text-[11px] text-hub-muted">{plural(data.projects.total, "proyecto vinculado", "proyectos vinculados")}</span>
        </div>
        {data.projects.items.length ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.projects.items.map((project) => <ProjectCardView key={project.id} project={project} today={data.today} />)}
          </ul>
        ) : <p className={`${panelCard} px-4 py-6 text-center text-sm text-hub-muted`}>Aún no perteneces a ningún proyecto.</p>}
        {data.projects.total > data.projects.items.length && <p className="text-[11px] text-hub-muted">Se muestran {data.projects.items.length} de {data.projects.total}. <Link href="/hub/proyectos" className="text-hub-accent underline">Ver todos</Link></p>}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`${panelCard} p-6 lg:col-span-7`}>
          <CardHeader icon={History} title="Observaciones recientes" />
          {data.observations.length ? (
            <ul className="mt-2 flex flex-col divide-y divide-hub-border">
              {data.observations.map((item) => (
                <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-hub-muted">
                    <span className={neutralChip}>{OBSERVATION_KINDS[item.kind]}</span>
                    <Link href={`/hub/proyectos/${item.project.id}/seguimiento`} className="font-medium text-hub-accent hover:underline">{item.project.name}</Link>
                    <span>· {item.author ?? "Autor no disponible"} · <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>{relativeTime(item.createdAt, data.cutoff) ?? formatDateTime(item.createdAt)}</time></span>
                  </div>
                  <p className="mt-1.5 line-clamp-3 whitespace-pre-line break-words text-sm text-hub-text">{item.excerpt}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-hub-muted">Aún no hay observaciones de seguimiento en tus proyectos.</p>}
        </div>
        <div className={`${panelCard} p-6 lg:col-span-5`}>
          <CardHeader icon={FileText} title="Mis productos" aside={<Link href="/hub/produccion" className="text-[11px] text-hub-accent hover:underline">Ver producción</Link>} />
          {data.products.total ? (
            <dl className="mt-2 flex flex-col gap-2">
              {(Object.keys(PRODUCT_STATUSES) as (keyof typeof PRODUCT_STATUSES)[]).map((status) => (
                <div key={status} className="flex items-center gap-3">
                  <dt className={byStatus[status] ? "w-40 truncate text-[13px] text-hub-text" : "w-40 truncate text-[13px] text-hub-muted"}>{PRODUCT_STATUSES[status]}</dt>
                  <dd aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-hub-border">
                    {byStatus[status] > 0 && <div className="h-full rounded-full bg-hub-chart" style={{ width: `${Math.max(4, (byStatus[status] * 100) / data.products.total)}%` }} />}
                  </dd>
                  <dd className="w-6 text-right font-mono text-[13px] text-hub-text">{byStatus[status]}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="mt-3 text-sm text-hub-muted">Aún no figuras como autor de productos académicos.</p>}
        </div>
      </section>
    </div>
  );
}

function Cutoff({ value }: { value: string }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-hub-muted">
      <Clock aria-hidden="true" className="size-3.5" />
      Datos al <time dateTime={value}>{formatDateTime(value)}</time> (Bogotá) · Solo información que puedes consultar
    </p>
  );
}

function Kpi({ label, icon: Icon, value, tag, hint, href }: { label: string; icon: LucideIcon; value: number; tag?: string; hint: string; href?: string }) {
  return (
    <div className={`${panelCard} relative flex flex-col justify-between p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-center justify-between gap-2">
        <dt className={eyebrow}>{href ? <Link href={href} className="after:absolute after:inset-0 hover:text-hub-text">{label}</Link> : label}</dt>
        <Icon aria-hidden="true" className="size-4.5 text-hub-accent" />
      </div>
      <dd className="mt-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight tabular-nums text-hub-text">{value}</span>
          {tag && <span className={dangerChip}>{tag}</span>}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-hub-muted" title={hint}>{hint}</p>
      </dd>
    </div>
  );
}

function CardHeader({ title, icon: Icon, aside }: { title: string; icon: LucideIcon; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-hub-text"><Icon aria-hidden="true" className="size-5 text-hub-accent" />{title}</h2>
      {aside}
    </div>
  );
}

function TaskGroup({ title, dot, titleClass, tag, tasks, grid, children }: {
  title: string; dot: string; titleClass: string; tag: string; tasks: TaskItem[]; grid?: boolean; children: (task: TaskItem) => React.ReactNode;
}) {
  if (!tasks.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex flex-wrap items-center gap-2 px-1">
        <span aria-hidden="true" className={`size-2 rounded-full ${dot}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${titleClass}`}>{title}</span>
        <span className={tag}>{plural(tasks.length, "tarea", "tareas")}</span>
      </h3>
      <ul className={grid ? "grid grid-cols-1 gap-1.5 md:grid-cols-2" : "flex flex-col gap-1.5"}>{tasks.map(children)}</ul>
    </div>
  );
}

function TaskRow({ task, tone, when }: { task: TaskItem; tone?: "alert"; when: React.ReactNode }) {
  const alert = tone === "alert";
  return (
    <li className={alert ? "flex flex-col justify-between gap-2 rounded-lg bg-hub-danger-bg p-2 md:flex-row md:items-center" : "flex flex-col justify-between gap-2 rounded-lg bg-hub-subtle p-2 transition-colors hover:bg-hub-hover md:flex-row md:items-center"}>
      <div className="flex min-w-0 items-center gap-2">
        <Circle aria-hidden="true" className={alert ? "size-4.5 shrink-0 text-hub-field-error" : "size-4.5 shrink-0 text-hub-muted"} />
        <div className="min-w-0">
          <Link href={`/hub/proyectos/${task.projectId}/tareas`} className="block truncate text-sm font-medium text-hub-text hover:underline">{task.title}</Link>
          <p className="flex items-center gap-1 truncate text-[11px] text-hub-muted"><FolderKanban aria-hidden="true" className="size-3" />{task.projectName}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 self-end md:self-auto">
        <span className={alert ? "flex items-center gap-1 text-[11px] font-medium text-hub-field-error" : "flex items-center gap-1 text-[11px] font-medium text-hub-soft"}>{when}</span>
        <span className={TASK_CHIP[task.status]}>{TASK_STATUS_LABELS[task.status]}</span>
      </div>
    </li>
  );
}

/** M-09: avance del proyecto; en los que lidera, vencidas del equipo y tareas sin responsable. */
function ProjectCardView({ project, today }: { project: ProjectCard; today: string }) {
  const leading = project.role === "leader";
  const sprintLate = project.sprint !== null && project.sprint.endDate < today;
  return (
    <li className={`${panelCard} flex flex-col justify-between gap-4 p-4 transition-shadow hover:shadow-md`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <span className={`${STATUS_CHIP[project.status]} self-start rounded-full`}>{PROJECT_STATUS_LABELS[project.status]}</span>
            <h3 className="break-words text-base font-semibold text-hub-text">{project.name}</h3>
          </div>
          <span className={leading ? `${chip} shrink-0 bg-hub-accent-soft font-semibold uppercase tracking-wider text-hub-accent` : `${neutralChip} shrink-0 uppercase tracking-wider`}>{leading ? "Líder de proyecto" : "Colaborador"}</span>
        </div>
        <div className="mt-1 flex flex-col gap-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-hub-muted">Avance del equipo</span>
            <span className="font-semibold text-hub-text">{project.tasks.progress === null ? "Sin tareas" : `${project.tasks.progress} % (${project.tasks.done}/${plural(project.tasks.total, "tarea", "tareas")})`}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-hub-border" aria-hidden="true">
            {project.tasks.progress !== null && <div className="h-2 rounded-full bg-hub-chart" style={{ width: `${project.tasks.progress}%` }} />}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
          {project.sprint ? (
            <span className={sprintLate ? "inline-flex items-center gap-1 font-medium text-hub-field-error" : "text-hub-muted"}>
              {sprintLate && <TriangleAlert aria-hidden="true" className="size-3" />}
              {project.sprint.name} · {sprintLate ? `Finalizó ${shortDay(project.sprint.endDate)} (sin cerrar)` : `Fin ${shortDay(project.sprint.endDate)}`}
              {project.sprint.tasks.progress !== null && ` · ${project.sprint.tasks.progress} %`}
            </span>
          ) : <span />}
          <span className="text-hub-muted">Mis pendientes: <strong className="text-hub-text">{plural(project.myOpen, "tarea", "tareas")}</strong></span>
        </div>
        {leading ? (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-hub-subtle p-2.5 text-[11px]">
            <span className={project.overdue ? "flex items-center gap-1.5 text-hub-field-error" : "flex items-center gap-1.5 text-hub-muted"}><AlertCircle aria-hidden="true" className="size-3.5" />Vencidas del equipo: <strong>{project.overdue}</strong></span>
            <span className="flex items-center gap-1.5 text-hub-muted"><UserX aria-hidden="true" className="size-3.5" />Sin responsable: <strong className="text-hub-text">{project.unassigned}</strong></span>
          </div>
        ) : (
          <div className="mt-1 rounded-lg bg-hub-subtle p-2.5 text-[11px] text-hub-muted">
            {project.leaders.length ? `Líder: ${project.leaders.map((leader) => leader.fullName).join(", ")}` : "Sin líder asignado"}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Link href={`/hub/proyectos/${project.id}/seguimiento`} className="inline-flex items-center gap-1 rounded-lg bg-hub-subtle px-2.5 py-1.5 text-[13px] font-medium text-hub-accent transition-colors hover:bg-hub-hover">
          Ver proyecto<span className="sr-only">: {project.name}</span><ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </li>
  );
}
