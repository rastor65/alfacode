"use client";

import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { ProjectPageHeader } from "@/features/projects/components/project-page-header";
import type { ProjectDetail, ProjectSummary, ProjectTabCounts } from "@/features/projects/types";
import { chip, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { EVENT_MODES, EVENT_STATUSES, EVENT_TYPES, formatEventRange, type EventItem, type Person } from "../types";
import { EventDetail, loadEventDetail, type EventDetailData } from "./event-detail";
import { EventForm, eventPeople } from "./event-form";
import { MODE_ICON, STATUS_BAR, STATUS_TONE, TYPE_ICON } from "./event-ui";

const primaryButton =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg";

type EventsCatalogProps = {
  events: EventItem[];
  projects: ProjectSummary[];
  institutional: boolean;
  viewerId: string;
  /** Proyecto fijo de la vista; sin el, es el catalogo institucional. */
  projectId?: string;
  project: Pick<ProjectDetail, "id" | "name" | "status" | "methodology" | "type"> | null;
  canCreate: boolean;
  tabCounts: ProjectTabCounts;
  /** Indicadores y filtros (los arma el servidor). */
  before: React.ReactNode;
  /** Calendario mensual; sin el, es la agenda (la lista ocupa todo el ancho). */
  calendar: React.ReactNode | null;
  /** Titulo de la lista (agenda o dia elegido). */
  heading: React.ReactNode;
  /** Paginacion (la arma el servidor). */
  after: React.ReactNode;
};

/** Actividades y eventos: encabezado, calendario, lista, detalle y alta/edicion en modales. */
export function EventsCatalog({ events, projects, institutional, viewerId, projectId, project, canCreate, tabCounts, before, calendar, heading, after }: EventsCatalogProps) {
  const router = useRouter();
  const request = useRef(0);
  const [mode, setMode] = useState<"detail" | "form" | null>(null);
  const [selected, setSelected] = useState<EventItem | undefined>();
  const [detail, setDetail] = useState<EventDetailData | null>(null);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    ++request.current;
    setMode(null);
    setSelected(undefined);
    setError(null);
  }

  async function open(event: EventItem) {
    const token = ++request.current;
    setMode("detail");
    setSelected(event);
    setDetail(null);
    setLoading(true);
    setError(null);

    try {
      const data = await loadEventDetail(event.id);
      if (request.current === token) setDetail(data);
    } catch (caught) {
      if (request.current === token) setError(describeError(caught));
    } finally {
      if (request.current === token) setLoading(false);
    }
  }

  async function form(event?: EventItem) {
    const token = ++request.current;
    setMode("form");
    setSelected(event);
    setPeople(null);
    setLoading(true);
    setError(null);
    const scope = event ? event.projectId : (projectId ?? defaultProjectId ?? null);

    try {
      const rows = await eventPeople(scope);
      if (request.current === token) setPeople(rows);
    } catch (caught) {
      if (request.current === token) setError(describeError(caught));
    } finally {
      if (request.current === token) setLoading(false);
    }
  }

  const allowedProjects = projects.filter((p) => p.id === selected?.projectId || (!["completed", "cancelled"].includes(p.status) && (institutional || p.myRole === "leader")));
  const defaultProjectId = institutional ? undefined : projects.find((p) => p.myRole === "leader" && !["completed", "cancelled"].includes(p.status))?.id;
  const newButton = canCreate ? (
    <button type="button" onClick={() => void form()} aria-haspopup="dialog" className={primaryButton}>
      <Plus aria-hidden="true" className="size-4" />
      Nueva actividad
    </button>
  ) : undefined;

  const list =
    events.length > 0 ? (
      <ul className={cn("grid gap-4", !calendar && "md:grid-cols-2")}>
        {events.map((event) => (
          <li key={event.id} className="min-w-0">
            <EventCard event={event} showProject={!project} onOpen={() => void open(event)} />
          </li>
        ))}
      </ul>
    ) : (
      <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">No hay actividades para los filtros y permisos actuales.</p>
    );

  return (
    <div className="flex flex-col gap-6">
      {project ? (
        <ProjectPageHeader
          project={project}
          current="actividades"
          crumb="Actividades"
          actions={newButton}
          counts={tabCounts}
        />
      ) : (
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Eventos y actividades</h1>
          {newButton}
        </header>
      )}

      {before}

      {calendar ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">{calendar}</div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
            {heading}
            {list}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {heading}
          {list}
        </div>
      )}

      {after}

      <Modal open={mode !== null} onClose={close} size="lg" title={mode === "form" ? (selected ? "Editar actividad" : "Nueva actividad") : (selected?.title ?? "Actividad")}>
        {error && <Alert tone="error">{error}</Alert>}
        {loading ? (
          <p role="status" className="text-sm text-hub-muted">
            Cargando…
          </p>
        ) : mode === "form" && people ? (
          <EventForm
            event={selected}
            projects={allowedProjects}
            people={people}
            institutional={institutional}
            viewerId={viewerId}
            initialProjectId={projectId}
            defaultProjectId={defaultProjectId}
            onCancel={close}
            onSaved={() => {
              close();
              router.refresh();
            }}
          />
        ) : detail && mode === "detail" ? (
          <EventDetail
            key={detail.event.id}
            initial={detail}
            onEdit={(event) => {
              void form(event);
            }}
            onChanged={() => router.refresh()}
            onDeleted={() => {
              close();
              router.refresh();
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function EventCard({ event, showProject, onOpen }: { event: EventItem; showProject: boolean; onOpen: () => void }) {
  const TypeIcon = TYPE_ICON[event.type];
  const ModeIcon = MODE_ICON[event.mode];
  const cancelled = event.status === "cancelled";
  const place = event.mode === "online" ? EVENT_MODES.online : (event.location ?? EVENT_MODES[event.mode]);

  return (
    <article className={cn(panelCard, "relative flex h-full min-w-0 flex-col gap-3 overflow-hidden p-5 pl-6", cancelled && "opacity-80")}>
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", STATUS_BAR[event.status])} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(chip, STATUS_TONE[event.status])}>{EVENT_STATUSES[event.status]}</span>
          <span className={`${neutralChip} gap-1`}>
            <TypeIcon aria-hidden="true" className="size-3" />
            {EVENT_TYPES[event.type]}
          </span>
        </div>
        <span className={cn("font-mono text-xs font-medium text-hub-muted", cancelled && "line-through")}>{formatEventRange(event.startsAt, event.endsAt)}</span>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className={cn("break-words text-base font-semibold text-hub-text", cancelled && "text-hub-muted line-through")}>
          <button
            type="button"
            onClick={onOpen}
            aria-haspopup="dialog"
            className="text-left underline-offset-4 hover:text-hub-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
          >
            {event.title}
          </button>
        </h3>
        {event.description && <p className="line-clamp-2 whitespace-pre-line text-sm text-hub-soft">{event.description}</p>}
        {cancelled && event.cancellationReason && <p className="text-xs text-hub-muted">Motivo: {event.cancellationReason}</p>}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-hub-muted">
        <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex min-w-0 items-center gap-1">
            <ModeIcon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{place}</span>
          </span>
          <span className="flex items-center gap-1">
            <Users aria-hidden="true" className="size-3.5" />
            {event.participantCount} {event.participantCount === 1 ? "inscrito" : "inscritos"}
          </span>
          {showProject && (
            <span className="min-w-0 truncate">
              {event.project ? (
                <Link href={`/hub/proyectos/${event.project.id}/actividades`} className="text-hub-accent underline-offset-4 hover:underline">
                  {event.project.name}
                </Link>
              ) : (
                "Institucional"
              )}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="inline-flex min-h-8 items-center rounded-lg bg-hub-subtle px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
        >
          Detalles
        </button>
      </div>
    </article>
  );
}
