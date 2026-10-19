import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { ProjectHeader } from "@/features/projects/components/project-header";
import { loadProjectData } from "@/features/projects/load-project";
import type { ProjectDetail, ProjectSummary } from "@/features/projects/types";
import { parsePage } from "@/features/membership/types";
import { parseSearch } from "@/features/members/types";
import { knownOption } from "@/features/academic/types";
import { serverApi } from "@/lib/api/server";
import { requireSessionUser } from "@/lib/auth/session";
import { EventsCatalog } from "./components/events-catalog";
import { bogotaInput, EVENT_STATUSES, EVENT_TYPES, monthDays, monthShift, overlapsDay, validMonth, type EventItem, type EventPage } from "./types";
export type EventSearch = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
async function allPages<T>(path: string, currentPath: string) {
  const initial = await serverApi<{ items: T[]; total: number }>(`${path}${path.includes("?") ? "&" : "?"}page=1&pageSize=100`, currentPath);
  const items = [...initial.items];
  for (let page = 2; items.length < initial.total; page++) {
    const next = await serverApi<{ items: T[] }>(`${path}${path.includes("?") ? "&" : "?"}page=${page}&pageSize=100`, currentPath);
    if (!next.items.length) break;
    items.push(...next.items);
  }
  return items;
}
export async function EventsPageContent({ projectId: fixedProjectId, searchParams }: { projectId?: string; searchParams: Promise<EventSearch> }) {
  const path = fixedProjectId ? `/hub/proyectos/${encodeURIComponent(fixedProjectId)}/actividades` : "/hub/actividades";
  const user = await requireSessionUser(path), params = await searchParams;
  const today = bogotaInput(new Date()).slice(0, 10), month = validMonth(first(params.mes)) ?? today.slice(0, 7), days = monthDays(month);
  const agenda = first(params.vista) === "agenda", day = days.includes(first(params.dia) ?? "") ? first(params.dia) : undefined;
  const q = parseSearch(params.q), type = knownOption(EVENT_TYPES, params.tipo), status = knownOption(EVENT_STATUSES, params.estado);
  const query = new URLSearchParams();
  if (q) query.set("q", q); if (type) query.set("type", type); if (status) query.set("status", status);
  const projectFilter = first(params.proyecto);
  const projectId = fixedProjectId ?? (projectFilter && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectFilter) ? projectFilter : undefined);
  if (projectId) query.set("projectId", projectId);
  query.set("from", agenda ? today : days[0]); if (!agenda) query.set("to", days[days.length - 1]);
  const [projects, projectTuple, initial] = await Promise.all([
    allPages<ProjectSummary>("/projects", path),
    fixedProjectId ? loadProjectData<[ProjectDetail]>([`/projects/${encodeURIComponent(fixedProjectId)}`], path) : Promise.resolve(null),
    serverApi<EventPage>(`/events?${query}&page=1&pageSize=${agenda ? 20 : 100}`, path),
  ]);
  const project = projectTuple?.[0] ?? null;
  // Calendario completo del mes: recorre todas las paginas autorizadas, no solo la primera.
  const monthEvents: EventItem[] = [...initial.items];
  if (!agenda) for (let p = 2; monthEvents.length < initial.total; p++) {
    const more = await serverApi<EventPage>(`/events?${query}&page=${p}&pageSize=100`, path); if (!more.items.length) break; monthEvents.push(...more.items);
  }
  const requestedPage = parsePage(params.pagina);
  let list: EventItem[], total: number, page: number;
  if (agenda) {
    const data = requestedPage === 1 ? initial : await serverApi<EventPage>(`/events?${query}&page=${requestedPage}&pageSize=20`, path);
    list = data.items; total = data.total; page = data.page;
  } else {
    const filtered = day ? monthEvents.filter(e => overlapsDay(e, day)) : monthEvents;
    total = filtered.length; page = Math.min(requestedPage, Math.max(1, Math.ceil(total / 20))); list = filtered.slice((page - 1) * 20, page * 20);
  }
  const href = (changes: Record<string, string>) => {
    const url = new URLSearchParams(); for (const [key, value] of Object.entries(params)) { const v = first(value); if (v) url.set(key, v); }
    for (const [key, value] of Object.entries(changes)) { if (value) url.set(key, value); else url.delete(key); } return `${path}?${url}`;
  };
  const institutional = initial.permissions.canCreateInstitutional;
  const canCreate = project ? project.permissions.canEdit : institutional || projects.some(p => p.myRole === "leader" && !["completed", "cancelled"].includes(p.status));
  const offset = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" }).format(new Date(`${month}-15T12:00:00Z`));
  return <div className="mx-auto w-full max-w-3xl">
    {project ? <ProjectHeader project={project} current="actividades" eyebrow="Actividades del proyecto" /> : <><p className="text-sm font-medium text-hub-accent">Gestión del semillero</p><h1 className="mt-1 text-2xl font-bold text-hub-text">Eventos y actividades</h1></>}
    <p className="mt-3 text-sm text-hub-muted">Actividades institucionales y de tus proyectos. Fechas y horas en Bogotá.</p>
    <nav aria-label="Vista de actividades" className="mt-5 flex flex-wrap gap-4"><Link className="text-sm text-hub-accent underline" aria-current={!agenda ? "page" : undefined} href={href({ vista: "", pagina: "" })}>Calendario mensual</Link><Link className="text-sm text-hub-accent underline" aria-current={agenda ? "page" : undefined} href={href({ vista: "agenda", dia: "", pagina: "" })}>Agenda desde hoy</Link></nav>
    <form action={path} method="get" role="search" className="my-5 space-y-3"><input type="hidden" name="vista" value={agenda ? "agenda" : "calendario"} />
      <FormField label="Buscar por título" name="q" type="search" defaultValue={q} maxLength={100} />
      <div className="grid gap-3 sm:grid-cols-2">{!agenda && <FormField label="Mes del calendario" type="month" name="mes" defaultValue={month} />}
        <div><label htmlFor="events-type" className="mb-1 block text-sm">Tipo</label><OptionSelect id="events-type" name="tipo" defaultValue={type ?? "all"} options={[{ value: "all", label: "Todos los tipos" }, ...Object.entries(EVENT_TYPES).map(([value, label]) => ({ value, label }))]} /></div>
        <div><label htmlFor="events-status" className="mb-1 block text-sm">Estado</label><OptionSelect id="events-status" name="estado" defaultValue={status ?? "all"} options={[{ value: "all", label: "Todos los estados" }, ...Object.entries(EVENT_STATUSES).map(([value, label]) => ({ value, label }))]} /></div>
        {!fixedProjectId && <div><label htmlFor="events-project" className="mb-1 block text-sm">Proyecto</label><OptionSelect id="events-project" name="proyecto" defaultValue={projectId ?? "all"} options={[{ value: "all", label: "Todos los ámbitos autorizados" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} /></div>}
      </div><Button type="submit" variant="neutral">Filtrar actividades</Button>
    </form>
    {!agenda && <section aria-label={`Calendario de ${monthLabel}`} className="mb-6 rounded-xl border border-hub-border p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><Link className="inline-flex min-h-11 items-center text-sm text-hub-accent underline" href={href({ mes: monthShift(month, -1), dia: "", pagina: "" })}>Mes anterior</Link><h2 className="font-semibold capitalize">{monthLabel}</h2><Link className="inline-flex min-h-11 items-center text-sm text-hub-accent underline" href={href({ mes: monthShift(month, 1), dia: "", pagina: "" })}>Mes siguiente</Link></div>
      <div className="grid grid-cols-7 gap-1 text-center">{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((name, i) => <abbr key={name} title={name} className="pb-2 text-xs text-hub-muted no-underline">{["L", "M", "X", "J", "V", "S", "D"][i]}</abbr>)}
        {Array.from({ length: offset }, (_, i) => <div key={`blank-${i}`} aria-hidden="true" />)}
        {days.map(date => { const count = monthEvents.filter(e => overlapsDay(e, date)).length; return <Link key={date} aria-label={`${date}${date === today ? ", hoy" : ""}: ${count} actividades`} aria-current={date === day ? "date" : undefined} href={href({ dia: date, pagina: "" })} className={`flex min-h-16 flex-col items-center justify-center rounded-lg border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${date === day ? "border-cyan-500 bg-hub-hover" : "border-hub-border hover:bg-hub-hover"} ${date === today ? "font-bold" : ""}`}><span>{Number(date.slice(-2))}</span>{count > 0 && <span className="mt-1 text-xs text-hub-accent">{count}<span className="sr-only"> actividades</span></span>}</Link>; })}
      </div><p className="mt-3 text-xs text-hub-muted">El número indica actividades que coinciden con ese día, incluidas las que duran varios días.</p>
    </section>}
    {day && !agenda && <p className="mb-4 text-sm">Actividades del {day} · <Link className="text-hub-accent underline" href={href({ dia: "", pagina: "" })}>Ver todo el mes</Link></p>}
    <EventsCatalog events={list} projects={projects} institutional={institutional} viewerId={user.id} projectId={fixedProjectId} canCreate={canCreate} />
    <nav aria-label="Paginación de actividades" className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-hub-muted"><span>{total} actividades autorizadas · Página {page} de {Math.max(1, Math.ceil(total / 20))}</span><div className="flex gap-4">{page > 1 && <Link className="text-hub-accent underline" href={href({ pagina: String(page - 1) })}>Anterior</Link>}{page * 20 < total && <Link className="text-hub-accent underline" href={href({ pagina: String(page + 1) })}>Siguiente</Link>}</div></nav>
  </div>;
}
