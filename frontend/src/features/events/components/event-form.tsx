"use client";
import { type FormEvent, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import type { ProjectDetail, ProjectSummary } from "@/features/projects/types";
import { allItems } from "@/lib/api/all-items";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";
import { bogotaInput, EVENT_MODES, EVENT_TYPES, localInputToUtc, type EventItem, type Person } from "../types";
export async function eventPeople(projectId: string | null): Promise<Person[]> {
  if (!projectId) return allItems<Person>("/users?status=active");
  const project = await apiRequest<ProjectDetail>(`/projects/${projectId}`);
  return project.members.filter(m => m.accountStatus === "active").map(m => ({ id: m.userId, fullName: m.fullName }));
}
const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const FIELD_MESSAGES = { title: "Escribe un título de 3 a 200 caracteres.", description: "La descripción admite hasta 10000 caracteres.", organizerId: "Elige un organizador activo.", startsAt: "Indica un inicio válido.", endsAt: "Indica un final posterior al inicio.", location: "La ubicación admite hasta 500 caracteres.", url: "Escribe un enlace HTTP o HTTPS válido.", registrationUrl: "Escribe un enlace HTTP o HTTPS válido.", requirements: "Los requisitos admiten hasta 10000 caracteres.", externalOrganizer: "El organizador externo admite hasta 200 caracteres." };
export function EventForm({ event, projects, people: initialPeople, institutional, viewerId, initialProjectId, defaultProjectId, onSaved, onCancel }: {
  event?: EventItem; projects: ProjectSummary[]; people: Person[]; institutional: boolean; viewerId: string; initialProjectId?: string; defaultProjectId?: string;
  onSaved: () => void; onCancel: () => void;
}) {
  const id = useId(), request = useRef(0);
  const [projectId, setProjectId] = useState(event ? event.projectId ?? "none" : initialProjectId ?? defaultProjectId ?? "none");
  const [people, setPeople] = useState(initialPeople);
  const [organizerId, setOrganizerId] = useState(event?.organizerId ?? (initialPeople.some(p => p.id === viewerId) ? viewerId : "none"));
  const [type, setType] = useState(event?.type ?? "meeting"), [mode, setMode] = useState(event?.mode ?? "onsite");
  const [pending, setPending] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<Record<keyof typeof FIELD_MESSAGES, string>>>({});
  async function changeProject(value: string) {
    const token = ++request.current; setProjectId(value); setLoading(true); setError(null);
    try { const rows = await eventPeople(value === "none" ? null : value); if (request.current === token) { setPeople(rows); setOrganizerId(rows.some(p => p.id === viewerId) ? viewerId : "none"); } }
    catch (caught) { if (request.current === token) { setError(describeError(caught)); setPeople([]); setOrganizerId("none"); } }
    finally { if (request.current === token) setLoading(false); }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget), text = (key: string) => String(form.get(key) ?? "").trim();
    const startsAt = localInputToUtc(text("startsAt")), endsAt = localInputToUtc(text("endsAt"));
    if (!startsAt || !endsAt || endsAt <= startsAt || organizerId === "none") { setError("Elige un organizador y un intervalo de fechas válido, con final posterior al inicio."); return; }
    setPending(true); setError(null); setFields({});
    try {
      await apiRequest(`/events${event ? `/${event.id}` : ""}`, { method: event ? "PUT" : "POST", body: {
        title: text("title"), description: text("description") || null, type, mode, startsAt, endsAt, organizerId,
        projectId: projectId === "none" ? null : projectId, location: mode === "online" ? null : text("location"), url: mode === "onsite" ? null : text("url"),
        externalOrganizer: type === "call" ? text("externalOrganizer") || null : null,
        requirements: type === "call" ? text("requirements") || null : null, registrationUrl: type === "call" ? text("registrationUrl") || null : null,
      } }); onSaved();
    } catch (caught) { setError(describeError(caught)); setFields(fieldErrorMessages(caught, FIELD_MESSAGES)); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    {error && <Alert tone="error">{error}</Alert>}
    <fieldset disabled={pending} className="space-y-4">
      <FormField label="Título de la actividad" name="title" required minLength={3} maxLength={200} defaultValue={event?.title} error={fields.title} />
      <TextAreaField label="Descripción" name="description" maxLength={10000} defaultValue={event?.description ?? ""} error={fields.description} />
      <div className="space-y-1.5"><label htmlFor={`${id}-type`} className="text-sm">Tipo</label><OptionSelect id={`${id}-type`} value={type} onValueChange={v => setType(v as EventItem["type"])} options={options(EVENT_TYPES)} /></div>
      <div className="space-y-1.5"><label htmlFor={`${id}-project`} className="text-sm">Proyecto</label><OptionSelect id={`${id}-project`} value={projectId} disabled={Boolean(event) || Boolean(initialProjectId) || loading} onValueChange={v => void changeProject(v)} options={[
        ...(institutional || (event && !event.projectId) ? [{ value: "none", label: "Institucional (sin proyecto)" }] : []), ...projects.map(p => ({ value: p.id, label: p.name })),
      ]} /><p className="text-xs text-hub-muted">El proyecto se conserva después de crear la actividad.</p></div>
      <div className="space-y-1.5"><label htmlFor={`${id}-organizer`} className="text-sm">Organizador responsable</label><OptionSelect id={`${id}-organizer`} value={organizerId} onValueChange={setOrganizerId} disabled={loading} options={[{ value: "none", label: "Selecciona un integrante" }, ...people.map(p => ({ value: p.id, label: p.fullName }))]} />{fields.organizerId && <p className="text-sm text-hub-field-error">{fields.organizerId}</p>}</div>
      {loading && <p role="status" className="text-sm text-hub-muted">Cargando integrantes del proyecto…</p>}
      <div className="grid gap-4 sm:grid-cols-2"><FormField label={type === "call" ? "Apertura (hora de Bogotá)" : "Inicio (hora de Bogotá)"} name="startsAt" type="datetime-local" required defaultValue={event ? bogotaInput(event.startsAt) : undefined} error={fields.startsAt} /><FormField label={type === "call" ? "Cierre (hora de Bogotá)" : "Final (hora de Bogotá)"} name="endsAt" type="datetime-local" required defaultValue={event ? bogotaInput(event.endsAt) : undefined} error={fields.endsAt} /></div>
      <div className="space-y-1.5"><label htmlFor={`${id}-mode`} className="text-sm">Modalidad</label><OptionSelect id={`${id}-mode`} value={mode} onValueChange={v => setMode(v as EventItem["mode"])} options={options(EVENT_MODES)} /></div>
      {mode !== "online" && <FormField label="Ubicación" name="location" required maxLength={500} defaultValue={event?.location ?? ""} error={fields.location} />}
      {mode !== "onsite" && <FormField label="Enlace de la actividad" name="url" type="url" required maxLength={2000} defaultValue={event?.url ?? ""} error={fields.url} />}
      {type === "call" && <><FormField label="Organizador externo (opcional)" name="externalOrganizer" maxLength={200} defaultValue={event?.externalOrganizer ?? ""} error={fields.externalOrganizer} /><TextAreaField label="Requisitos informativos" name="requirements" maxLength={10000} defaultValue={event?.requirements ?? ""} error={fields.requirements} /><FormField label="Enlace externo de inscripción (opcional)" name="registrationUrl" type="url" maxLength={2000} defaultValue={event?.registrationUrl ?? ""} error={fields.registrationUrl} /><p className="text-xs text-hub-muted">La convocatoria registra información; las postulaciones se gestionan por fuera del HUB.</p></>}
    </fieldset>
    <div className="flex flex-wrap justify-end gap-2"><Button variant="neutral" disabled={pending} onClick={onCancel}>Cancelar</Button><Button type="submit" pending={pending} disabled={loading} pendingLabel="Guardando…">Guardar actividad</Button></div>
  </form>;
}
