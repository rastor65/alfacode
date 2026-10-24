"use client";

import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { formatCalendarDate, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/features/projects/types";
import { formatDateTime } from "@/lib/format";

import { relativeTime, type OverviewPanel } from "../types";
import { chip, dangerChip, STATUS_CHIP } from "./dashboard-ui";

type Row = OverviewPanel["projects"]["items"][number];
const PAGE_SIZE = 10;
const FILTERS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" }, { value: "active", label: "Activo" }, { value: "planning", label: "Planificación" },
  { value: "paused", label: "Pausado" }, { value: "proposed", label: "Propuesto" },
];
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** G-01: filtra y pagina en el navegador los proyectos ya autorizados que entrego el servidor. */
export function ProjectsTable({ items, cutoff }: { items: Row[]; cutoff: string }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [page, setPage] = useState(1);
  const needle = normalize(query.trim());
  const filtered = items.filter((row) => (status === "all" || row.status === status) &&
    (!needle || normalize(row.name).includes(needle) || row.leaders.some((leader) => normalize(leader.fullName).includes(needle))));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const first = filtered.length ? (current - 1) * PAGE_SIZE + 1 : 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-9 items-center rounded-lg bg-hub-subtle px-2.5 text-hub-muted focus-within:ring-2 focus-within:ring-hub-accent">
          <ListFilter aria-hidden="true" className="mr-1.5 size-4" />
          <span className="sr-only">Filtrar por nombre o líder</span>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Filtrar por nombre o líder…"
            className="w-48 bg-transparent text-sm text-hub-text placeholder:text-hub-muted focus:outline-none sm:w-60" />
        </label>
        <div role="group" aria-label="Filtrar por fase" className="flex flex-wrap rounded-lg bg-hub-subtle p-0.5 text-xs">
          {FILTERS.map((filter) => (
            <button key={filter.value} type="button" aria-pressed={status === filter.value} onClick={() => { setStatus(filter.value); setPage(1); }}
              className={status === filter.value ? "min-h-8 rounded bg-hub-panel px-2.5 font-semibold text-hub-text shadow-sm" : "min-h-8 rounded px-2.5 text-hub-muted hover:text-hub-text"}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-184 border-collapse text-left text-[13px]">
          <caption className="sr-only">Proyectos propuestos, en planificación, activos y pausados</caption>
          <thead>
            <tr className="bg-hub-subtle text-[11px] uppercase tracking-wider text-hub-muted">
              <th scope="col" className="rounded-l-lg px-3 py-2.5 font-medium">Proyecto</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Fase y sprint</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Avance tareas</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Tiempo</th>
              <th scope="col" className="px-3 py-2.5 text-center font-medium">Vencidas</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Última act.</th>
              <th scope="col" className="rounded-r-lg px-3 py-2.5 text-right font-medium"><span className="sr-only">Acción</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hub-border">
            {visible.map((row) => {
              const behind = row.risks.includes("behind_schedule"), late = row.risks.includes("past_end_date");
              return (
                <tr key={row.id} className="align-top transition-colors hover:bg-hub-hover">
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="max-w-xs truncate font-medium text-hub-text" title={row.name}>{row.name}</span>
                      {row.risks.length > 0 && <span className={dangerChip} title="Alertas activas">{row.risks.length}<span className="sr-only"> alertas</span></span>}
                    </div>
                    <p className="text-[11px] text-hub-muted">{row.leaders.length ? row.leaders.map((leader) => leader.fullName).join(" · ") : "Sin líder asignado"}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={STATUS_CHIP[row.status]}>{PROJECT_STATUS_LABELS[row.status]}</span>
                    <p className="mt-0.5 text-[11px] text-hub-muted">
                      {row.sprint ? `${row.sprint.name} · Fin ${formatCalendarDate(row.sprint.endDate)}` : row.methodology === "agile" ? "Sin sprint activo" : "Tradicional"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex w-32 flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
                        <span className={behind ? "font-semibold text-hub-field-error" : "font-semibold text-hub-text"}>{row.tasks.progress === null ? "Sin tareas" : `${row.tasks.progress} %`}</span>
                        {row.tasks.total > 0 && <span className="font-mono text-hub-muted">{row.tasks.done}/{row.tasks.total}</span>}
                      </div>
                      {row.tasks.progress !== null && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hub-border" aria-hidden="true">
                          <div className={behind ? "h-full rounded-full bg-hub-field-error" : "h-full rounded-full bg-hub-chart"} style={{ width: `${row.tasks.progress}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={late || behind ? "font-medium text-hub-field-error" : "font-medium text-hub-text"}>{row.elapsed === null ? "Sin fechas" : `${row.elapsed} % tiempo`}</span>
                    {row.endDate && <p className={late ? "font-mono text-[11px] text-hub-field-error" : "text-[11px] text-hub-muted"}>{late ? "Venció" : "Fin"}: {formatCalendarDate(row.endDate)}</p>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.overdue ? <span className={`${chip} bg-hub-danger-bg font-mono text-hub-danger-text`}>{row.overdue}</span> : <span className="text-hub-muted" aria-label="Ninguna">—</span>}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-hub-muted">
                    {row.lastActivityAt ? <time dateTime={row.lastActivityAt} title={formatDateTime(row.lastActivityAt)}>{relativeTime(row.lastActivityAt, cutoff) ?? formatDateTime(row.lastActivityAt)}</time> : "Sin registros"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/hub/proyectos/${row.id}/seguimiento`} className="inline-flex min-h-8 items-center rounded bg-hub-subtle px-2.5 text-[11px] font-medium text-hub-text transition-colors hover:bg-hub-hover">
                      Ficha<span className="sr-only"> de {row.name}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visible.length && <p className="py-8 text-center text-sm text-hub-muted">{items.length ? "Ningún proyecto coincide con el filtro." : "No hay proyectos en curso."}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-hub-muted">
        <span aria-live="polite">Mostrando {first}–{first ? first + visible.length - 1 : 0} de {filtered.length} {filtered.length === 1 ? "proyecto" : "proyectos"}</span>
        {pages > 1 && (
          <nav aria-label="Paginas de proyectos" className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className="grid size-8 place-items-center rounded bg-hub-subtle text-hub-text disabled:opacity-40"><ChevronLeft aria-hidden="true" className="size-4" /><span className="sr-only">Anterior</span></button>
            {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" onClick={() => setPage(number)} aria-current={number === current ? "page" : undefined}
                className={number === current ? "min-h-8 min-w-8 rounded bg-hub-accent px-2 font-semibold text-hub-bg" : "min-h-8 min-w-8 rounded px-2 text-hub-text hover:bg-hub-hover"}>{number}</button>
            ))}
            <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages} className="grid size-8 place-items-center rounded bg-hub-subtle text-hub-text disabled:opacity-40"><ChevronRight aria-hidden="true" className="size-4" /><span className="sr-only">Siguiente</span></button>
          </nav>
        )}
      </div>
    </>
  );
}
