import { CalendarDays, ChevronLeft, ChevronRight, Filter, List, Search, X } from "lucide-react";
import Link from "next/link";

import { chip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { plural } from "@/features/tracking/types";
import { cn } from "@/lib/utils";

import { STATUS_BAR, STATUS_TONE } from "./components/event-ui";
import {
  EVENT_STATUSES,
  EVENT_STATUS_KEYS,
  EVENT_TYPES,
  eventStats,
  eventsOnDay,
  formatEventRange,
  type EventItem,
} from "./types";

type LinkFn = (changes: Record<string, string>) => string;

function Kpi({ label, value, hint, children, text = false }: { label: string; value: string | number; hint: string; children?: React.ReactNode; text?: boolean }) {
  return (
    <div className={`${panelCard} flex min-w-0 flex-col gap-3 p-4`}>
      <dt className={eyebrow}>{label}</dt>
      <dd className="flex min-w-0 flex-col gap-1.5">
        <span className={cn("line-clamp-2 break-words font-semibold leading-tight tabular-nums text-hub-text", text ? "text-xl" : "text-2xl sm:text-3xl")}>{value}</span>
        <span className="line-clamp-2 text-xs text-hub-muted">{hint}</span>
        {children}
      </dd>
    </div>
  );
}

type KpisProps = {
  monthLabel: string;
  /** Actividades del mes sin los filtros de la lista. */
  monthEvents: EventItem[];
  /** Actividades desde hoy (las que siguen o empiezan), en orden de inicio. */
  upcoming: EventItem[];
};

/** Indicadores: proxima actividad, mes por estado, en curso e inscritos del mes. */
export function EventsKpis({ monthLabel, monthEvents, upcoming }: KpisProps) {
  const next = upcoming.find((event) => event.status === "scheduled");
  const live = upcoming.filter((event) => event.status === "in_progress");
  const stats = eventStats(monthEvents);
  const used = EVENT_STATUS_KEYS.filter((key) => stats.byStatus[key] > 0);

  return (
    <dl aria-label="Indicadores de actividades" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi text label="Próxima actividad" value={next?.title ?? "—"} hint={next ? formatEventRange(next.startsAt, next.endsAt) : "Sin actividades programadas"} />
      <Kpi
        label={monthLabel}
        value={monthEvents.length}
        hint={used.length > 0 ? used.map((key) => `${EVENT_STATUSES[key]} ${stats.byStatus[key]}`).join(" · ") : "Sin actividades en el mes"}
      >
        {monthEvents.length > 0 && (
          <span aria-hidden="true" className="mt-1 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-hub-border">
            {used.map((key) => (
              <span key={key} className={STATUS_BAR[key]} style={{ width: `${(stats.byStatus[key] * 100) / monthEvents.length}%` }} />
            ))}
          </span>
        )}
      </Kpi>
      <Kpi
        label="En curso ahora"
        value={live.length}
        hint={live.length > 0 ? live.map((event) => event.title).join(" · ") : "Ninguna en este momento"}
      />
      <Kpi
        label="Inscritos en el mes"
        value={stats.enrolled}
        hint={`En ${plural(monthEvents.length, "actividad", "actividades")}`}
      />
    </dl>
  );
}

const controlClass =
  "min-h-9 max-w-56 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

type ToolbarProps = {
  path: string;
  agenda: boolean;
  month: string;
  monthLabel: string;
  prevMonth: string;
  nextMonth: string;
  currentMonth: string;
  q: string;
  type?: string;
  status?: string;
  projectId?: string;
  /** Solo el catalogo institucional filtra por proyecto. */
  projects?: { id: string; name: string }[];
  link: LinkFn;
};

/** Vista, periodo y filtros. Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */
export function EventsToolbar({ path, agenda, month, monthLabel, prevMonth, nextMonth, currentMonth, q, type, status, projectId, projects, link }: ToolbarProps) {
  const filtering = Boolean(q || type || status || (projects && projectId));
  const segment = (active: boolean) =>
    cn(
      "inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
      active ? "bg-hub-panel text-hub-accent shadow-sm ring-1 ring-hub-border" : "text-hub-soft hover:text-hub-text",
    );
  const arrow =
    "inline-flex size-9 items-center justify-center rounded-lg text-hub-muted transition-colors hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

  return (
    <div className={`${panelCard} flex min-w-0 flex-col gap-3 p-3`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Vista de actividades" className="inline-flex max-w-full flex-wrap gap-1 self-start rounded-lg bg-hub-subtle p-1">
          <Link href={link({ vista: "", pagina: "" })} aria-current={!agenda ? "page" : undefined} className={segment(!agenda)}>
            <CalendarDays aria-hidden="true" className="size-4" />
            Calendario mensual
          </Link>
          <Link href={link({ vista: "agenda", dia: "", pagina: "" })} aria-current={agenda ? "page" : undefined} className={segment(agenda)}>
            <List aria-hidden="true" className="size-4" />
            Agenda desde hoy
          </Link>
        </nav>
        {!agenda && (
          <div className="flex items-center gap-1 self-start">
            <Link href={link({ mes: prevMonth, dia: "", pagina: "" })} className={arrow} aria-label="Mes anterior">
              <ChevronLeft aria-hidden="true" className="size-5" />
            </Link>
            <span className="min-w-36 text-center text-sm font-semibold text-hub-text">{monthLabel}</span>
            <Link href={link({ mes: nextMonth, dia: "", pagina: "" })} className={arrow} aria-label="Mes siguiente">
              <ChevronRight aria-hidden="true" className="size-5" />
            </Link>
            {month !== currentMonth && (
              <Link
                href={link({ mes: "", dia: "", pagina: "" })}
                className="ml-1 inline-flex min-h-9 items-center rounded-lg bg-hub-subtle px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
              >
                Hoy
              </Link>
            )}
          </div>
        )}
      </div>

      {/* La clave reinicia los campos (no controlados) cuando cambian los filtros por un enlace, como "Limpiar". */}
      <form
        key={`${agenda}|${month}|${q}|${type ?? ""}|${status ?? ""}|${projectId ?? ""}`}
        action={path}
        method="get"
        role="search"
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="vista" value={agenda ? "agenda" : "calendario"} />
        {!agenda && <input type="hidden" name="mes" value={month} />}
        <label className="relative block min-w-56 flex-1 lg:max-w-md">
          <span className="sr-only">Buscar por título</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-hub-muted" />
          <input type="search" name="q" maxLength={100} defaultValue={q} placeholder="Buscar por título" className={`${controlClass} w-full max-w-none pl-9`} />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-hub-muted">
          Tipo
          <select name="tipo" defaultValue={type ?? ""} className={controlClass}>
            <option value="">Todos</option>
            {Object.entries(EVENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-hub-muted">
          Estado
          <select name="estado" defaultValue={status ?? ""} className={controlClass}>
            <option value="">Todos</option>
            {Object.entries(EVENT_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {projects && (
          <label className="flex items-center gap-1.5 text-xs text-hub-muted">
            Proyecto
            <select name="proyecto" defaultValue={projectId ?? ""} className={controlClass}>
              <option value="">Todos los ámbitos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hub-border bg-hub-panel px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
        >
          <Filter aria-hidden="true" className="size-4" />
          Filtrar
        </button>
        {filtering && (
          <Link
            href={link({ q: "", tipo: "", estado: "", proyecto: "", dia: "", pagina: "" })}
            className={cn(chip, "min-h-9 gap-1 px-2.5 text-sm font-normal text-hub-muted hover:bg-hub-hover hover:text-hub-text")}
          >
            <X aria-hidden="true" className="size-4" />
            Limpiar
          </Link>
        )}
      </form>
    </div>
  );
}

const WEEKDAYS = [
  ["Lunes", "L", "Lun"],
  ["Martes", "M", "Mar"],
  ["Miércoles", "X", "Mié"],
  ["Jueves", "J", "Jue"],
  ["Viernes", "V", "Vie"],
  ["Sábado", "S", "Sáb"],
  ["Domingo", "D", "Dom"],
] as const;

type CalendarProps = {
  month: string;
  monthLabel: string;
  days: string[];
  /** Dias en blanco antes del dia 1 (la semana empieza el lunes). */
  offset: number;
  today: string;
  /** Dia elegido para filtrar la lista. */
  day?: string;
  events: EventItem[];
  link: LinkFn;
};

const MAX_CHIPS = 2;

/** Rejilla mensual: cada dia enlaza al filtro por dia y muestra sus primeras actividades. */
export function EventsCalendar({ monthLabel, days, offset, today, day, events, link }: CalendarProps) {
  return (
    <section aria-label={`Calendario de ${monthLabel}`} className={`${panelCard} flex min-w-0 flex-col gap-3 p-4`}>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map(([name, short, abbreviation]) => (
          <abbr key={name} title={name} className={`${eyebrow} rounded-md bg-hub-subtle py-1.5 no-underline`}>
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{abbreviation}</span>
          </abbr>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <div key={`blank-${index}`} aria-hidden="true" />
        ))}
        {days.map((date) => {
          const here = eventsOnDay(events, date);
          const isToday = date === today;
          const selected = date === day;

          return (
            <Link
              key={date}
              aria-label={`${date}${isToday ? ", hoy" : ""}: ${here.length} actividades`}
              aria-current={selected ? "date" : undefined}
              href={link({ dia: selected ? "" : date, pagina: "" })}
              className={cn(
                "flex min-h-16 min-w-0 flex-col gap-1 rounded-lg border p-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent sm:min-h-24",
                selected ? "border-hub-accent bg-hub-accent-soft" : "border-hub-border hover:bg-hub-hover",
                isToday && !selected && "bg-hub-subtle",
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <span className={cn("text-xs", isToday ? "font-bold text-hub-accent" : "font-medium text-hub-text")}>{Number(date.slice(-2))}</span>
                {isToday && <span className="rounded bg-hub-accent px-1 text-[9px] font-bold uppercase leading-4 text-hub-bg">Hoy</span>}
              </span>
              {here.length > 0 && <span className="text-xs font-medium text-hub-accent sm:hidden">{here.length}</span>}
              <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                {here.slice(0, MAX_CHIPS).map((event) => (
                  <span key={event.id} className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium leading-3", STATUS_TONE[event.status], event.status === "cancelled" && "line-through")} title={event.title}>
                    {event.title}
                  </span>
                ))}
                {here.length > MAX_CHIPS && <span className="text-[10px] text-hub-muted">+{here.length - MAX_CHIPS} más</span>}
              </span>
            </Link>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-hub-muted" aria-label="Leyenda de estados">
        {EVENT_STATUS_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-2 rounded-full ${STATUS_BAR[key]}`} />
            {EVENT_STATUSES[key]}
          </li>
        ))}
        <li className={`${neutralChip} sm:hidden`}>El número es de actividades que coinciden con el día</li>
      </ul>
    </section>
  );
}

type PaginationProps = { total: number; page: number; pageSize: number; shown: number; link: LinkFn };

const pagerClass =
  "inline-flex min-h-9 items-center gap-1 rounded-lg border border-hub-border bg-hub-panel px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

/** Paginacion por enlaces (sin JavaScript) con el conteo de actividades autorizadas. */
export function EventsPagination({ total, page, pageSize, shown, link }: PaginationProps) {
  return (
    <nav aria-label="Paginación de actividades" className="flex flex-wrap items-center justify-between gap-3 text-sm text-hub-muted">
      <span>
        {total === 0 ? "0 actividades autorizadas" : `Mostrando ${shown} de ${total} actividades autorizadas`} · Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link className={pagerClass} href={link({ pagina: String(page - 1) })}>
            Anterior
          </Link>
        )}
        {page * pageSize < total && (
          <Link className={pagerClass} href={link({ pagina: String(page + 1) })}>
            Siguiente
          </Link>
        )}
      </div>
    </nav>
  );
}

