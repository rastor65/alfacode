import Link from "next/link";

import { knownOption } from "@/features/academic/types";
import { parseSearch } from "@/features/members/types";
import { parsePage } from "@/features/membership/types";
import { loadProjectData, loadTabCounts } from "@/features/projects/load-project";
import type { ProjectDetail, ProjectSummary } from "@/features/projects/types";
import { neutralChip } from "@/features/tracking/components/dashboard-ui";
import { serverApi } from "@/lib/api/server";
import { requireSessionUser } from "@/lib/auth/session";

import { EventsCatalog } from "./components/events-catalog";
import { EventsCalendar, EventsKpis, EventsPagination, EventsToolbar } from "./events-sections";
import {
  bogotaInput,
  EVENT_STATUSES,
  EVENT_TYPES,
  EVENTS_PAGE_SIZE,
  eventsOnDay,
  monthDays,
  monthShift,
  validMonth,
  type EventItem,
  type EventPage,
} from "./types";

export type EventSearch = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIST_SIZE = 20;

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

/** Actividades y eventos: del proyecto (con `projectId`) o del catalogo institucional. Fechas y horas en Bogota. */
export async function EventsPageContent({ projectId: fixedProjectId, searchParams }: { projectId?: string; searchParams: Promise<EventSearch> }) {
  const path = fixedProjectId ? `/hub/proyectos/${encodeURIComponent(fixedProjectId)}/actividades` : "/hub/actividades";
  const user = await requireSessionUser(path);
  const params = await searchParams;
  const today = bogotaInput(new Date()).slice(0, 10);
  const month = validMonth(first(params.mes)) ?? today.slice(0, 7);
  const days = monthDays(month);
  const agenda = first(params.vista) === "agenda";
  const day = days.includes(first(params.dia) ?? "") ? first(params.dia) : undefined;
  const q = parseSearch(params.q);
  const type = knownOption(EVENT_TYPES, params.tipo);
  const status = knownOption(EVENT_STATUSES, params.estado);
  const projectFilter = first(params.proyecto);
  const projectId = fixedProjectId ?? (projectFilter && UUID.test(projectFilter) ? projectFilter : undefined);
  const filtering = Boolean(q || type || status);

  // `scope` limita por proyecto; `filters` agrega los filtros de la lista. Los indicadores usan solo `scope`.
  const scope = new URLSearchParams();
  if (projectId) scope.set("projectId", projectId);
  const filters = new URLSearchParams(scope);
  if (q) filters.set("q", q);
  if (type) filters.set("type", type);
  if (status) filters.set("status", status);
  const monthRange = `from=${days[0]}&to=${days[days.length - 1]}`;

  async function monthEventsOf(query: URLSearchParams) {
    const firstPage = await serverApi<EventPage>(`/events?${query}&${monthRange}&page=1&pageSize=${EVENTS_PAGE_SIZE}`, path);
    const items: EventItem[] = [...firstPage.items];

    // Calendario completo del mes: recorre todas las paginas autorizadas, no solo la primera.
    for (let page = 2; items.length < firstPage.total; page++) {
      const more = await serverApi<EventPage>(`/events?${query}&${monthRange}&page=${page}&pageSize=${EVENTS_PAGE_SIZE}`, path);
      if (!more.items.length) break;
      items.push(...more.items);
    }

    return items;
  }

  const requestedPage = parsePage(params.pagina);
  const [projects, projectTuple, upcoming, monthAll, monthFiltered, agendaPage, tabCounts] = await Promise.all([
    allPages<ProjectSummary>("/projects", path),
    fixedProjectId ? loadProjectData<[ProjectDetail]>([`/projects/${encodeURIComponent(fixedProjectId)}`], path) : Promise.resolve(null),
    serverApi<EventPage>(`/events?${scope}&from=${today}&page=1&pageSize=50`, path),
    monthEventsOf(scope),
    filtering && !agenda ? monthEventsOf(filters) : Promise.resolve(null),
    agenda ? serverApi<EventPage>(`/events?${filters}&from=${today}&page=${requestedPage}&pageSize=${LIST_SIZE}`, path) : Promise.resolve(null),
    fixedProjectId ? loadTabCounts(fixedProjectId, path) : Promise.resolve({}),
  ]);
  const project = projectTuple?.[0] ?? null;
  const monthEvents = monthFiltered ?? monthAll;

  let list: EventItem[], total: number, page: number;
  if (agendaPage) {
    list = agendaPage.items;
    total = agendaPage.total;
    page = agendaPage.page;
  } else {
    const filtered = day ? eventsOnDay(monthEvents, day) : monthEvents;
    total = filtered.length;
    page = Math.min(requestedPage, Math.max(1, Math.ceil(total / LIST_SIZE)));
    list = filtered.slice((page - 1) * LIST_SIZE, page * LIST_SIZE);
  }

  const link = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const single = first(value);
      if (single) next.set(key, single);
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const queryString = next.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  const institutional = upcoming.permissions.canCreateInstitutional;
  const canCreate = project ? project.permissions.canEdit : institutional || projects.some((p) => p.myRole === "leader" && !["completed", "cancelled"].includes(p.status));
  const offset = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;
  const monthName = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" }).format(new Date(`${month}-15T12:00:00Z`));
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const dayLabel = day ? new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`)) : null;

  return (
    <div className="mx-auto w-full max-w-430">
      <EventsCatalog
        events={list}
        projects={projects}
        institutional={institutional}
        viewerId={user.id}
        projectId={fixedProjectId}
        project={project && { id: project.id, name: project.name, status: project.status, methodology: project.methodology, type: project.type }}
        canCreate={canCreate}
        tabCounts={tabCounts}
        before={
          <>
            <EventsKpis monthLabel={monthLabel} monthEvents={monthAll} upcoming={upcoming.items} />
            <EventsToolbar
              path={path}
              agenda={agenda}
              month={month}
              monthLabel={monthLabel}
              prevMonth={monthShift(month, -1)}
              nextMonth={monthShift(month, 1)}
              currentMonth={today.slice(0, 7)}
              q={q}
              type={type}
              status={status}
              projectId={projectId}
              projects={fixedProjectId ? undefined : projects.map((p) => ({ id: p.id, name: p.name }))}
              link={link}
            />
          </>
        }
        calendar={agenda ? null : <EventsCalendar month={month} monthLabel={monthLabel} days={days} offset={offset} today={today} day={day} events={monthEvents} link={link} />}
        heading={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-hub-text">{agenda ? "Agenda desde hoy" : dayLabel ? `Actividades del ${dayLabel}` : "Actividades del mes"}</h2>
              <span className={`${neutralChip} rounded-full font-mono`}>{total}</span>
            </div>
            {day && !agenda && (
              <Link href={link({ dia: "", pagina: "" })} className="text-sm font-medium text-hub-accent underline-offset-4 hover:underline">
                Ver todo el mes
              </Link>
            )}
          </div>
        }
        after={<EventsPagination total={total} page={page} pageSize={LIST_SIZE} shown={list.length} link={link} />}
      />
    </div>
  );
}
