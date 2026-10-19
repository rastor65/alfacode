"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { ProjectSummary } from "@/features/projects/types";
import { describeError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { EVENT_STATUSES, EVENT_TYPES, type EventItem, type Person } from "../types";
import { EventDetail, loadEventDetail, type EventDetailData } from "./event-detail";
import { EventForm, eventPeople } from "./event-form";

export function EventsCatalog({ events, projects, institutional, viewerId, projectId, canCreate }: {
  events: EventItem[]; projects: ProjectSummary[]; institutional: boolean; viewerId: string; projectId?: string; canCreate: boolean;
}) {
  const router = useRouter(), request = useRef(0);
  const [mode, setMode] = useState<"detail" | "form" | null>(null), [selected, setSelected] = useState<EventItem | undefined>();
  const [detail, setDetail] = useState<EventDetailData | null>(null), [people, setPeople] = useState<Person[] | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState<string | null>(null);
  function close() { ++request.current; setMode(null); setSelected(undefined); setError(null); }
  async function open(event: EventItem) {
    const token = ++request.current; setMode("detail"); setSelected(event); setDetail(null); setLoading(true); setError(null);
    try { const data = await loadEventDetail(event.id); if (request.current === token) setDetail(data); }
    catch (caught) { if (request.current === token) setError(describeError(caught)); }
    finally { if (request.current === token) setLoading(false); }
  }
  async function form(event?: EventItem) {
    const token = ++request.current; setMode("form"); setSelected(event); setPeople(null); setLoading(true); setError(null);
    const scope = event ? event.projectId : projectId ?? defaultProjectId ?? null;
    try { const rows = await eventPeople(scope); if (request.current === token) setPeople(rows); }
    catch (caught) { if (request.current === token) setError(describeError(caught)); }
    finally { if (request.current === token) setLoading(false); }
  }
  const allowedProjects = projects.filter(p => p.id === selected?.projectId || (!["completed", "cancelled"].includes(p.status) && (institutional || p.myRole === "leader")));
  const defaultProjectId = institutional ? undefined : projects.find(p => p.myRole === "leader" && !["completed", "cancelled"].includes(p.status))?.id;
  return <>
    {canCreate && <Button variant="neutral" className="min-h-11" aria-haspopup="dialog" onClick={() => void form()}>Nueva actividad</Button>}
    {events.length ? <ul className="mt-4 divide-y divide-hub-border rounded-xl border border-hub-border">{events.map(event => <li key={event.id}><button type="button" aria-haspopup="dialog" onClick={() => void open(event)} className="flex min-h-16 w-full flex-wrap items-start justify-between gap-3 p-4 text-left transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><span className="min-w-0 flex-1"><span className="block break-words font-medium text-hub-text">{event.title}</span><span className="mt-1 block text-sm text-hub-muted">{formatDateTime(event.startsAt)} · {EVENT_TYPES[event.type]}</span><span className="mt-1 block break-words text-xs text-hub-muted">{event.project?.name ?? "Actividad institucional"} · {event.participantCount} inscritos</span></span><Badge>{EVENT_STATUSES[event.status]}</Badge></button></li>)}</ul> : <p className="mt-4 rounded-xl border border-dashed border-hub-border px-4 py-8 text-center text-sm text-hub-muted">No hay actividades para los filtros y permisos actuales.</p>}
    <Modal open={mode !== null} onClose={close} size="lg" title={mode === "form" ? selected ? "Editar actividad" : "Nueva actividad" : selected?.title ?? "Actividad"}>
      {error && <Alert tone="error">{error}</Alert>}
      {loading ? <p role="status" className="text-sm text-hub-muted">Cargando…</p> : mode === "form" && people ? <EventForm event={selected} projects={allowedProjects} people={people} institutional={institutional} viewerId={viewerId} initialProjectId={projectId} defaultProjectId={defaultProjectId} onCancel={close} onSaved={() => { close(); router.refresh(); }} /> : detail && mode === "detail" ? <EventDetail key={detail.event.id} initial={detail} onEdit={event => { void form(event); }} onChanged={() => router.refresh()} onDeleted={() => { close(); router.refresh(); }} /> : null}
    </Modal>
  </>;
}
