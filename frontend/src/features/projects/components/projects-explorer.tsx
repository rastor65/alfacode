"use client";

import { ArrowRight, CircleCheck, Clock, History, LayoutGrid, ListFilter, Rows3, Search, TriangleAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { chip, dangerChip, neutralChip, panelCard, STATUS_CHIP } from "@/features/tracking/components/dashboard-ui";
import { RiskChips } from "@/features/tracking/components/risk-chips";
import { plural, relativeTime, RISK_LABELS } from "@/features/tracking/types";
import { bogotaDay, formatDateTime, formatShortDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  METHODOLOGY_LABELS,
  PROJECT_ROLE_LABELS,
  PROJECT_SORT_LABELS,
  PROJECT_STATUS_LABELS,
  projectsHref,
  saveView,
  type ListFilters,
  type ProjectListSummary,
  type ProjectsView,
  type ProjectStatus,
  type ProjectSummary,
} from "../types";

const TAB_LABELS: Record<ProjectStatus, string> = {
  active: "Activos", planning: "En planificación", paused: "Pausados", proposed: "Propuestos", completed: "Finalizados", cancelled: "Cancelados",
};
const controlClass = "min-h-9 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

type ExplorerProps = {
  items: ProjectSummary[];
  summary: ProjectListSummary;
  filters: ListFilters;
  /** Proyectos que cumplen los filtros (todas las paginas). */
  total: number;
  cutoff: string;
  initialView: ProjectsView;
  authority: boolean;
};

/** Avance de tareas del proyecto en porcentaje; sin tareas no hay porcentaje (nunca 0 % ni 100 %). */
const percentOf = (project: ProjectSummary) => (project.progress.total ? Math.round((project.progress.done * 100) / project.progress.total) : null);

/**
 * I-27: pestañas por estado, filtros que se aplican al escribir (quedan en la URL), orden, interruptor
 * de alertas y vista de tarjetas o tabla. Los datos llegan ya autorizados y calculados por el servidor.
 */
export function ProjectsExplorer({ items, summary, filters, total, cutoff, initialView, authority }: ExplorerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const [view, setView] = useState(initialView);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(filters);
  const today = bogotaDay(cutoff);

  useEffect(() => {
    latest.current = filters;
    return () => clearTimeout(timer.current);
  }, [filters]);

  function go(patch: Partial<ListFilters>) {
    startTransition(() => router.replace(projectsHref(latest.current, patch), { scroll: false }));
  }

  function search(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => go({ q: value.trim() }), 300);
  }

  function chooseView(next: ProjectsView) {
    setView(next);
    saveView(next);
  }

  const tabs: { status?: ProjectStatus; label: string; count: number }[] = [
    { label: "Todos", count: summary.total },
    ...(Object.keys(TAB_LABELS) as ProjectStatus[]).map((status) => ({ status, label: TAB_LABELS[status], count: summary.byStatus[status] })),
  ];
  const filtered = Boolean(filters.q || filters.status || filters.methodology || filters.alerts);

  return (
    <>
      <nav aria-label="Filtrar por estado" className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex min-w-max items-center gap-1.5 rounded-xl bg-hub-subtle p-1">
          {tabs.map((tab) => {
            const current = tab.status === filters.status;
            return (
              <li key={tab.label}>
                <Link
                  href={projectsHref(filters, { status: tab.status })}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                    current ? "bg-hub-accent font-semibold text-hub-bg shadow-sm" : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                  )}
                >
                  {tab.label}
                  <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[11px]", current ? "bg-hub-bg/20" : "bg-hub-border text-hub-muted")}>{tab.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div role="search" className={cn(panelCard, "flex flex-col items-stretch justify-between gap-2 p-2 lg:flex-row lg:items-center")}>
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Buscar proyectos por nombre o líder</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-hub-muted" />
          <input
            type="search"
            value={query}
            maxLength={100}
            placeholder="Buscar por nombre o líder…"
            onChange={(event) => search(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && go({ q: query.trim() })}
            className="min-h-10 w-full rounded-lg bg-hub-subtle py-2 pl-10 pr-4 text-sm text-hub-text placeholder:text-hub-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-hub-muted">
            <ListFilter aria-hidden="true" className="size-4" />Ordenar
            <select value={filters.sort} onChange={(event) => go({ sort: event.target.value as ListFilters["sort"] })} className={controlClass}>
              {Object.entries(PROJECT_SORT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-hub-muted">
            Metodología
            <select value={filters.methodology ?? ""} onChange={(event) => go({ methodology: (event.target.value || undefined) as ListFilters["methodology"] })} className={controlClass}>
              <option value="">Todas</option>
              {Object.entries(METHODOLOGY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text transition-colors hover:bg-hub-hover has-focus-visible:ring-2 has-focus-visible:ring-hub-accent">
            <input type="checkbox" checked={filters.alerts} onChange={(event) => go({ alerts: event.target.checked })} className="size-4 cursor-pointer accent-(--hub-accent) focus:outline-none" />
            Solo con alertas
            <span className={cn(dangerChip, "rounded-full font-mono")}>{summary.atRisk}</span>
          </label>
          <div role="group" aria-label="Tipo de vista" className="inline-flex items-center gap-1 rounded-lg bg-hub-subtle p-1">
            {([["cards", "Tarjetas", LayoutGrid], ["table", "Tabla", Rows3]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => chooseView(value)}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1 rounded px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                  view === value ? "bg-hub-panel text-hub-accent shadow-sm" : "text-hub-muted hover:text-hub-text",
                )}
              >
                <Icon aria-hidden="true" className="size-4.5" /><span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="-mb-2 text-xs text-hub-muted" aria-live="polite">
        {plural(total, "proyecto", "proyectos")}{filtered ? " con los filtros actuales" : ""}
      </p>

      <div className={cn("transition-opacity duration-200", pending && "opacity-60")} aria-busy={pending}>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
            {filtered ? "No hay proyectos con esos filtros." : authority ? "Aún no hay proyectos. Crea el primero con «Nuevo proyecto»." : "Todavía no participas en ningún proyecto."}
          </p>
        ) : view === "cards" ? (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((project) => <ProjectCardItem key={project.id} project={project} cutoff={cutoff} today={today} />)}
          </ul>
        ) : (
          <ProjectsTableView items={items} cutoff={cutoff} today={today} />
        )}
      </div>
    </>
  );
}

type ItemProps = { project: ProjectSummary; cutoff: string; today: string };

function activityOf(project: ProjectSummary, cutoff: string) {
  if (!project.lastActivityAt) return null;
  return relativeTime(project.lastActivityAt, cutoff) ?? formatShortDay(bogotaDay(project.lastActivityAt));
}

function TimeLabel({ project }: { project: ProjectSummary }) {
  const overdueEnd = project.risks.includes("past_end_date");
  if (project.elapsed === null) return <span className="text-hub-muted">Sin fechas</span>;
  return <span className={overdueEnd ? "font-medium text-hub-field-error" : "text-hub-text"}>{overdueEnd ? "Plazo vencido" : `${project.elapsed} % tiempo`}</span>;
}

function SprintLine({ project, today }: { project: ProjectSummary; today: string }) {
  if (!project.sprint) return <span className="text-hub-muted">{project.methodology === "agile" ? "Sin sprint activo" : "Sin sprints (tradicional)"}</span>;
  const late = project.sprint.endDate < today;
  return <span className={late ? "font-medium text-hub-field-error" : "font-medium text-hub-accent"}>{project.sprint.name} · {late ? "Venció" : "Fin"} {formatShortDay(project.sprint.endDate)}</span>;
}

function ProgressBlock({ project }: { project: ProjectSummary }) {
  const percent = percentOf(project), { done, total } = project.progress, behind = project.risks.includes("behind_schedule");
  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-hub-muted">Progreso global</span>
        <span className={cn("font-mono font-semibold", behind ? "text-hub-field-error" : "text-hub-text")}>
          {percent === null ? "Sin tareas" : `${percent} % (${done}/${plural(total, "tarea", "tareas")})`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-hub-border" aria-hidden="true">
        {percent !== null && <div className={cn("h-full rounded-full", behind ? "bg-hub-field-error" : "bg-hub-chart")} style={{ width: `${percent}%` }} />}
      </div>
    </div>
  );
}

function ProjectCardItem({ project, cutoff, today }: ItemProps) {
  const alerts = project.risks.length > 0, activity = activityOf(project, cutoff);
  return (
    <li className={cn(panelCard, "group relative flex flex-col justify-between overflow-hidden p-6 transition-shadow hover:shadow-md")}>
      {alerts && <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-hub-field-error" />}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(STATUS_CHIP[project.status], "rounded-full")}>{PROJECT_STATUS_LABELS[project.status]}</span>
            <span className={neutralChip}>{METHODOLOGY_LABELS[project.methodology]}</span>
          </div>
          {activity && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-hub-muted" title={project.lastActivityAt ? formatDateTime(project.lastActivityAt) : undefined}>
              <History aria-hidden="true" className="size-3.5" />{activity}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="break-words text-lg font-semibold leading-snug text-hub-text">{project.name}</h3>
          <p className="flex items-center gap-1.5 text-[13px] text-hub-muted">
            <UserRound aria-hidden="true" className="size-4 shrink-0" />
            <span>
              {project.leaders.length ? <>Líder: <strong className="font-semibold text-hub-soft">{project.leaders.map((leader) => leader.fullName).join(", ")}</strong></> : "Sin líder asignado"}
              {" · "}{plural(project.memberCount, "integrante", "integrantes")}
            </span>
          </p>
        </div>
        {alerts && <RiskChips project={{ ...project, tasks: { progress: percentOf(project) } }} />}
        {project.myRole && (
          <span className={cn(neutralChip, "self-start")}>
            Mi rol: {PROJECT_ROLE_LABELS[project.myRole]}{project.myOpen > 0 && ` · ${plural(project.myOpen, "tarea asignada", "tareas asignadas")}`}
          </span>
        )}
        <div className="flex flex-col gap-1 rounded-lg bg-hub-subtle p-2.5 text-xs">
          <div className="flex items-center justify-between gap-2"><SprintLine project={project} today={today} /><span className="font-mono"><TimeLabel project={project} /></span></div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-hub-muted">
            {project.startDate || project.endDate ? (
              <>
                <span>Inicio: {project.startDate ? formatShortDay(project.startDate) : "—"}</span>
                <span className={project.risks.includes("past_end_date") ? "font-medium text-hub-field-error" : undefined}>Fin: {project.endDate ? formatShortDay(project.endDate) : "—"}</span>
              </>
            ) : <span>Sin fechas definidas</span>}
          </div>
        </div>
        <ProgressBlock project={project} />
      </div>
      <div className="mt-6 flex items-center justify-between gap-2 border-t border-hub-border pt-4">
        {alerts ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-hub-field-error"><TriangleAlert aria-hidden="true" className="size-3.5" />{plural(project.risks.length, "alerta activa", "alertas activas")}</span>
        ) : project.status === "active" ? (
          <span className="flex items-center gap-1 text-[11px] font-medium text-hub-muted"><CircleCheck aria-hidden="true" className="size-3.5" />Sin alertas</span>
        ) : <span />}
        <Link href={`/hub/proyectos/${project.id}`} className="group/link flex items-center gap-1 rounded text-sm font-semibold text-hub-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
          Ver proyecto<span className="sr-only">: {project.name}</span>
          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </div>
    </li>
  );
}

function ProjectsTableView({ items, cutoff, today }: { items: ProjectSummary[]; cutoff: string; today: string }) {
  return (
    <div className={cn(panelCard, "overflow-hidden")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-208 border-collapse text-left text-[13px]">
          <caption className="sr-only">Proyectos con estado, avance, tiempo, integrantes y alertas</caption>
          <thead>
            <tr className="bg-hub-subtle text-[11px] uppercase tracking-wider text-hub-muted">
              {["Proyecto", "Fase y sprint", "Avance", "Tiempo", "Integrantes", "Alertas", "Última act."].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-semibold">{heading}</th>)}
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acción</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hub-border">
            {items.map((project) => {
              const percent = percentOf(project), behind = project.risks.includes("behind_schedule"), activity = activityOf(project, cutoff);
              return (
                <tr key={project.id} className="align-top transition-colors hover:bg-hub-hover">
                  <td className="max-w-72 px-4 py-3">
                    <p className="break-words font-medium text-hub-text">{project.name}</p>
                    <p className="text-[11px] text-hub-muted">{project.leaders.length ? project.leaders.map((leader) => leader.fullName).join(" · ") : "Sin líder asignado"}</p>
                    {project.myRole && <p className="mt-0.5 text-[11px] text-hub-muted">Mi rol: {PROJECT_ROLE_LABELS[project.myRole]}{project.myOpen > 0 && ` · ${plural(project.myOpen, "tarea", "tareas")}`}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(STATUS_CHIP[project.status], "rounded-full")}>{PROJECT_STATUS_LABELS[project.status]}</span>
                    <p className="mt-1 text-[11px]"><SprintLine project={project} today={today} /></p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex w-32 flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
                        <span className={cn("font-semibold", behind ? "text-hub-field-error" : "text-hub-text")}>{percent === null ? "Sin tareas" : `${percent} %`}</span>
                        {project.progress.total > 0 && <span className="font-mono text-hub-muted">{project.progress.done}/{project.progress.total}</span>}
                      </div>
                      {percent !== null && <div className="h-1.5 w-full overflow-hidden rounded-full bg-hub-border" aria-hidden="true"><div className={cn("h-full rounded-full", behind ? "bg-hub-field-error" : "bg-hub-chart")} style={{ width: `${percent}%` }} /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TimeLabel project={project} />
                    {project.endDate && <p className={cn("text-[11px]", project.risks.includes("past_end_date") ? "font-medium text-hub-field-error" : "text-hub-muted")}>Fin: {formatShortDay(project.endDate)}</p>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{project.memberCount}</td>
                  <td className="px-4 py-3">
                    {project.risks.length ? (
                      <ul aria-label="Alertas" className="flex flex-col items-start gap-1">
                        {project.risks.map((risk) => <li key={risk} className={cn(dangerChip, "gap-1")}><TriangleAlert aria-hidden="true" className="size-3" />{RISK_LABELS[risk]}</li>)}
                      </ul>
                    ) : <span className="text-hub-muted" aria-label="Sin alertas">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-hub-muted">
                    {activity ? <span className="inline-flex items-center gap-1"><Clock aria-hidden="true" className="size-3" />{activity}</span> : "Sin registros"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/hub/proyectos/${project.id}`} className={cn(chip, "min-h-8 bg-hub-subtle px-2.5 text-[11px] text-hub-text hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent")}>
                      Ver<span className="sr-only"> proyecto: {project.name}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
