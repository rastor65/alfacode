import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "@/features/academic/types";
import { knownKey } from "@/features/administration/types";
import { EVENT_STATUSES, EVENT_TYPES } from "@/features/events/types";
import { parsePage } from "@/features/membership/types";
import { formatCalendarDate, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/features/projects/types";
import { ApiRequestError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { isAuthority } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

import { Breakdown, Stat, StatGrid } from "./components/panel-ui";
import { PanelLoading } from "./components/panel-states";
import { plural, progressLabel, type EventReport, type ProductReport, type ProjectReport } from "./types";

export type ReportSearch = Record<string, string | string[] | undefined>;
const REPORTS = { proyectos: "Proyectos", produccion: "Producción académica", actividades: "Actividades" } as const;
type ReportKind = keyof typeof REPORTS;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const calendar = (v: string | string[] | undefined) => { const d = first(v); return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined; };
const uuid = (v: string | string[] | undefined) => { const d = first(v); return d && /^[0-9a-f-]{36}$/i.test(d) ? d : undefined; };
const cell = "px-3 py-2 align-top";
const all = (labels: Record<string, string>, everything = "Todos") => [{ value: "all", label: everything }, ...Object.entries(labels).map(([value, label]) => ({ value, label }))];

/** Opciones del filtro de linea: recorre todas las paginas sin truncar. */
async function researchLines(path: string) {
  const items: { id: string; name: string }[] = [];
  for (let page = 1; page < 50; page++) {
    const data = await serverApi<{ items: { id: string; name: string }[]; total: number }>(`/research-lines?pageSize=100&page=${page}`, path);
    items.push(...data.items);
    if (!data.items.length || items.length >= data.total) break;
  }
  return items;
}

const path = "/hub/reportes";

/**
 * F6-06: reportes filtrables en pantalla para coordinacion y administracion (R-01 a R-03). El
 * permiso se comprueba antes del limite de Suspense para conservar el 404 sin autoridad.
 */
export async function ReportsPage({ searchParams }: { searchParams: Promise<ReportSearch> }) {
  const user = await requireSessionUser(path), p = await searchParams;
  if (!isAuthority(user.roles)) notFound();
  const kind: ReportKind = knownKey(REPORTS, p.reporte) ?? "proyectos";
  const key = new URLSearchParams(Object.entries(p).flatMap(([k, v]) => (first(v) ? [[k, first(v)!]] : []))).toString();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="text-sm font-medium text-hub-accent">Seguimiento</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Reportes</h1>
      <p className="mt-2 text-sm text-hub-muted">Consultas filtrables sobre los registros existentes. Los totales del resumen corresponden a todos los resultados filtrados, no solo a la página visible.</p>

      <nav aria-label="Tipo de reporte" className="mt-6 flex flex-wrap gap-4 border-b border-hub-border pb-3">
        {(Object.keys(REPORTS) as ReportKind[]).map((item) => (
          <Link key={item} href={`${path}?reporte=${item}`} aria-current={item === kind ? "page" : undefined}
            className={item === kind ? "min-h-11 content-center text-sm font-semibold text-hub-text" : "min-h-11 content-center text-sm text-hub-accent underline"}>{REPORTS[item]}</Link>
        ))}
      </nav>
      <Suspense key={key} fallback={<div className="mt-6"><PanelLoading label="Preparando el reporte…" /></div>}>
        <ReportsContent p={p} kind={kind} />
      </Suspense>
    </div>
  );
}

async function ReportsContent({ p, kind }: { p: ReportSearch; kind: ReportKind }) {
  const typeLabels: Record<string, string> = kind === "proyectos" ? PROJECT_TYPE_LABELS : kind === "produccion" ? PRODUCT_TYPES : EVENT_TYPES;
  const statusLabels: Record<string, string> = kind === "proyectos" ? PROJECT_STATUS_LABELS : kind === "produccion" ? PRODUCT_STATUSES : EVENT_STATUSES;
  const filters = {
    from: calendar(p.desde), to: calendar(p.hasta), type: knownKey(typeLabels, p.tipo) as string | undefined,
    status: knownKey(statusLabels, p.estado) as string | undefined, line: uuid(p.linea),
    projectType: kind === "produccion" ? (knownKey(PROJECT_TYPE_LABELS, p.tipoProyecto) as string | undefined) : undefined,
  };
  const query = new URLSearchParams({ page: String(parsePage(p.pagina)), pageSize: "20" });
  for (const [key, value] of Object.entries({ from: filters.from, to: filters.to, type: filters.type, status: filters.status, researchLineId: filters.line, projectType: filters.projectType }))
    if (value) query.set(key, value);
  const endpoint = { proyectos: "projects", produccion: "products", actividades: "events" }[kind];

  let data: ProjectReport | ProductReport | EventReport | null = null, problem: string | null = null;
  const lines = await researchLines(path);
  try {
    data = await serverApi<ProjectReport | ProductReport | EventReport>(`/tracking/reports/${endpoint}?${query}`, path);
  } catch (caught) {
    if (caught instanceof ApiRequestError && caught.status === 403) notFound();
    if (!(caught instanceof ApiRequestError && caught.status === 400)) throw caught;
    problem = "Revisa los filtros: las fechas deben ser válidas y la inicial no puede ser posterior a la final.";
  }
  const link = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(p)) { const v = first(value); if (v) next.set(key, v); }
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    return `${path}?${next}`;
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <form action={path} method="get" role="search" aria-label={`Filtros del reporte de ${REPORTS[kind].toLowerCase()}`} className="my-5 space-y-3">
        <input type="hidden" name="reporte" value={kind} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Desde" name="desde" type="date" defaultValue={filters.from} />
          <FormField label="Hasta" name="hasta" type="date" defaultValue={filters.to} />
          <div><label htmlFor="report-line" className="mb-1 block text-sm">Línea de investigación</label>
            <OptionSelect id="report-line" name="linea" defaultValue={filters.line ?? "all"} options={[{ value: "all", label: "Todas" }, ...lines.map((l) => ({ value: l.id, label: l.name }))]} /></div>
          <div><label htmlFor="report-type" className="mb-1 block text-sm">{kind === "proyectos" ? "Tipo de proyecto" : kind === "produccion" ? "Tipo de producto" : "Tipo de actividad"}</label>
            <OptionSelect id="report-type" name="tipo" defaultValue={filters.type ?? "all"} options={all(typeLabels)} /></div>
          <div><label htmlFor="report-status" className="mb-1 block text-sm">Estado</label>
            <OptionSelect id="report-status" name="estado" defaultValue={filters.status ?? "all"} options={all(statusLabels)} /></div>
          {kind === "produccion" && <div><label htmlFor="report-project-type" className="mb-1 block text-sm">Tipo de proyecto</label>
            <OptionSelect id="report-project-type" name="tipoProyecto" defaultValue={filters.projectType ?? "all"} options={all(PROJECT_TYPE_LABELS)} /></div>}
        </div>
        <p className="text-xs text-hub-muted">{kind === "proyectos" ? "Fechas: proyectos cuyo periodo planificado se cruza con el rango (sin fecha de inicio no se incluyen al filtrar por fechas)." : kind === "produccion" ? "Fechas: fecha de publicación o presentación; los productos sin fecha no se incluyen al filtrar por fechas. La línea y el tipo de proyecto se toman del proyecto vinculado." : "Fechas: día de inicio en hora de Colombia. Las actividades institucionales no tienen línea."}</p>
        <div className="flex flex-wrap gap-3"><Button type="submit" variant="neutral">Filtrar</Button><Link href={`${path}?reporte=${kind}`} className="min-h-11 content-center text-sm text-hub-accent underline">Limpiar filtros</Link></div>
      </form>

      {problem && <Alert tone="error">{problem}</Alert>}
      {data && <ReportBody kind={kind} data={data} />}
      {data && data.total > data.pageSize && (
        <nav aria-label="Paginación del reporte" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-hub-muted">
          <span>{plural(data.total, "resultado", "resultados")} · Página {data.page} de {pages}</span>
          <div className="flex gap-4">
            {data.page > 1 && <Link className="text-hub-accent underline" href={link({ pagina: String(data.page - 1) })}>Anterior</Link>}
            {data.page < pages && <Link className="text-hub-accent underline" href={link({ pagina: String(data.page + 1) })}>Siguiente</Link>}
          </div>
        </nav>
      )}
    </>
  );
}

function Table({ caption, head, children, empty }: { caption: string; head: string[]; children: React.ReactNode; empty: boolean }) {
  if (empty) return <p className="rounded-2xl border border-dashed border-hub-border px-4 py-8 text-center text-sm text-hub-muted">Sin resultados para los filtros actuales.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-hub-border" tabIndex={0} role="region" aria-label={caption}>
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-hub-border text-xs text-hub-muted"><tr>{head.map((h) => <th key={h} scope="col" className={cell}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-hub-border">{children}</tbody>
      </table>
    </div>
  );
}

function ReportBody({ kind, data }: { kind: ReportKind; data: ProjectReport | ProductReport | EventReport }) {
  if (kind === "proyectos") {
    const d = data as ProjectReport;
    return (
      <div className="space-y-6">
        <StatGrid label="Resumen del reporte de proyectos">
          <Stat label="Proyectos" value={d.summary.total} />
          <Stat label="Tareas terminadas" value={`${d.summary.tasks.done} de ${d.summary.tasks.total}`} hint={`Avance operativo: ${progressLabel(d.summary.tasks)}`} />
        </StatGrid>
        <Breakdown title="Proyectos por estado" labels={PROJECT_STATUS_LABELS} counts={d.summary.byStatus} />
        <Table caption="Proyectos filtrados" empty={!d.items.length} head={["Proyecto", "Tipo", "Estado", "Periodo", "Líneas", "Tareas", "Productos", "Resultados", "Actividades"]}>
          {d.items.map((r) => (
            <tr key={r.id}>
              <th scope="row" className={`${cell} font-medium`}><Link href={`/hub/proyectos/${r.id}/seguimiento`} className="text-hub-accent underline-offset-4 hover:underline">{r.name}</Link></th>
              <td className={cell}>{PROJECT_TYPE_LABELS[r.type]}</td><td className={cell}>{PROJECT_STATUS_LABELS[r.status]}</td>
              <td className={cell}>{r.startDate ? `${formatCalendarDate(r.startDate)} – ${r.endDate ? formatCalendarDate(r.endDate) : "sin fin"}` : "Sin fechas"}</td>
              <td className={cell}>{r.lines.length ? r.lines.join(", ") : "—"}</td>
              <td className={`${cell} tabular-nums`}>{r.tasks.total ? `${r.tasks.done}/${r.tasks.total} · ${progressLabel(r.tasks)}` : "Sin tareas"}</td>
              <td className={`${cell} tabular-nums`}>{r.products}</td><td className={`${cell} tabular-nums`}>{r.researchResults}</td><td className={`${cell} tabular-nums`}>{r.events}</td>
            </tr>
          ))}
        </Table>
      </div>
    );
  }
  if (kind === "produccion") {
    const d = data as ProductReport;
    return (
      <div className="space-y-6">
        <StatGrid label="Resumen del reporte de producción"><Stat label="Productos" value={d.summary.total} hint={plural(d.summary.byStatus.published, "publicado o presentado", "publicados o presentados")} /></StatGrid>
        <div className="grid gap-4 sm:grid-cols-2">
          <Breakdown title="Productos por estado" labels={PRODUCT_STATUSES} counts={d.summary.byStatus} />
          <Breakdown title="Productos por tipo" labels={PRODUCT_TYPES} counts={d.summary.byType} />
        </div>
        <Table caption="Productos filtrados" empty={!d.items.length} head={["Título", "Tipo", "Estado", "Fecha", "Proyecto", "Autorías"]}>
          {d.items.map((r) => (
            <tr key={r.id}>
              <th scope="row" className={`${cell} font-medium`}>{r.title}</th>
              <td className={cell}>{PRODUCT_TYPES[r.type]}</td><td className={cell}>{PRODUCT_STATUSES[r.status]}</td>
              <td className={cell}>{formatCalendarDate(r.productDate) ?? "Sin fecha"}</td>
              <td className={cell}>{r.project ? <Link href={`/hub/proyectos/${r.project.id}/produccion`} className="text-hub-accent underline-offset-4 hover:underline">{r.project.name}</Link> : "Institucional"}</td>
              <td className={`${cell} tabular-nums`}>{r.authors}</td>
            </tr>
          ))}
        </Table>
      </div>
    );
  }
  const d = data as EventReport;
  return (
    <div className="space-y-6">
      <StatGrid label="Resumen del reporte de actividades">
        <Stat label="Actividades" value={d.summary.total} hint={plural(d.summary.byStatus.completed, "realizada", "realizadas")} />
        <Stat label="Asistencias registradas" value={d.summary.attended} hint="No incluye inscripciones sin confirmar" />
      </StatGrid>
      <Breakdown title="Actividades por estado" labels={EVENT_STATUSES} counts={d.summary.byStatus} />
      <Table caption="Actividades filtradas" empty={!d.items.length} head={["Actividad", "Tipo", "Estado", "Inicio", "Proyecto", "Participantes", "Asistencias"]}>
        {d.items.map((r) => (
          <tr key={r.id}>
            <th scope="row" className={`${cell} font-medium`}>{r.title}</th>
            <td className={cell}>{EVENT_TYPES[r.type]}</td><td className={cell}>{EVENT_STATUSES[r.status]}</td>
            <td className={cell}><time dateTime={r.startsAt}>{formatDateTime(r.startsAt)}</time></td>
            <td className={cell}>{r.project ? r.project.name : "Institucional"}</td>
            <td className={`${cell} tabular-nums`}>{r.participants}</td><td className={`${cell} tabular-nums`}>{r.attended}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
