"use client";
import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { DocumentForm } from "@/features/documents/components/document-form";
import type { DocumentItem, DocumentList, UploadLimits } from "@/features/documents/types";
import { safeExternalUrl } from "@/features/academic/types";
import { allItems } from "@/lib/api/all-items";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { ATTENDANCE_STATUSES, EVENT_MODES, EVENT_STATUSES, EVENT_TYPES, PARTICIPANT_ROLES, type EventItem, type Evidence, type ParticipantPage, type Person } from "../types";
import { eventPeople } from "./event-form";

export type EventDetailData = { event: EventItem; participants: ParticipantPage; documents: Evidence[] };
export async function loadEventDetail(id: string, page = 1): Promise<EventDetailData> {
  const [event, participants, documents] = await Promise.all([apiRequest<EventItem>(`/events/${id}`), apiRequest<ParticipantPage>(`/events/${id}/participants?page=${page}`), allItems<Evidence>(`/events/${id}/documents`)]);
  return { event, participants, documents };
}
const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));
type Confirmation = { path: string; method: "POST" | "DELETE"; message: string; status?: keyof typeof EVENT_STATUSES; closes?: boolean };

export function EventDetail({ initial, onEdit, onChanged, onDeleted }: { initial: EventDetailData; onEdit: (event: EventItem) => void; onChanged: () => void; onDeleted: () => void }) {
  const id = useId(), request = useRef(0);
  const confirmationRef = useRef<HTMLFormElement>(null);
  const [data, setData] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[] | null>(null), [documentOptions, setDocumentOptions] = useState<DocumentItem[] | null>(null);
  const [upload, setUpload] = useState<UploadLimits | null>(null), [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  useEffect(() => {
    if (confirmation) {
      confirmationRef.current?.scrollIntoView({ block: "nearest" });
      confirmationRef.current?.querySelector<HTMLInputElement | HTMLButtonElement>("input, button")?.focus();
    }
  }, [confirmation]);
  const event = data.event, base = `/events/${event.id}`, permissions = event.permissions;
  const eventUrl = safeExternalUrl(event.url), registrationUrl = safeExternalUrl(event.registrationUrl);
  const documentPath = event.projectId ? `/projects/${event.projectId}/documents` : "/documents?scope=institutional";
  async function refresh(page = data.participants.page) {
    const token = ++request.current, next = await loadEventDetail(event.id, page);
    if (request.current === token) setData(next);
  }
  async function run(action: () => Promise<unknown>, page = data.participants.page) {
    setBusy(true); setError(null);
    try { await action(); await refresh(page); onChanged(); return true; }
    catch (caught) { setError(describeError(caught)); return false; }
    finally { setBusy(false); }
  }
  async function participantPage(page: number) {
    setBusy(true); setError(null);
    try { await refresh(page); }
    catch (caught) { setError(describeError(caught)); }
    finally { setBusy(false); }
  }
  async function confirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!confirmation) return;
    const form = new FormData(e.currentTarget), reason = String(form.get("reason") ?? "").trim();
    const current = confirmation; setBusy(true); setError(null);
    try { await apiRequest(current.path, { method: current.method, ...(current.status ? { body: { status: current.status, ...(current.status === "cancelled" ? { reason } : {}) } } : {}) });
      setConfirmation(null); if (current.closes) onDeleted(); else { await refresh(1); onChanged(); }
    } catch (caught) { setError(describeError(caught)); }
    finally { setBusy(false); }
  }
  async function showPeople() {
    setBusy(true); setError(null);
    try { setPeople(await eventPeople(event.projectId)); }
    catch (caught) { setError(describeError(caught)); }
    finally { setBusy(false); }
  }
  async function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    if (form.get("userId") === "none") { setError("Selecciona un integrante para registrarlo."); return; }
    if (await run(() => apiRequest(`${base}/participants`, { method: "POST", body: { userId: String(form.get("userId")), role: String(form.get("role")) } }), 1)) setPeople(null);
  }
  async function showDocumentOptions(uploading = false) {
    setBusy(true); setError(null);
    try {
      if (uploading) {
        const listing = await apiRequest<DocumentList>(`${documentPath}${documentPath.includes("?") ? "&" : "?"}pageSize=1`);
        if (!listing.upload.enabled || !(event.projectId ? listing.permissions.canUpload : listing.permissions.canUploadInstitutional)) throw new Error("La carga de documentos no está habilitada para este ámbito.");
        setUpload(listing.upload);
      } else setDocumentOptions(await allItems<DocumentItem>(documentPath));
    } catch (caught) { setError(caught instanceof Error ? caught.message : describeError(caught)); }
    finally { setBusy(false); }
  }
  async function linkExisting(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const documentId = String(new FormData(e.currentTarget).get("documentId"));
    if (documentId === "none") { setError("Selecciona un documento para vincularlo."); return; }
    if (await run(() => apiRequest(`${base}/documents`, { method: "POST", body: { documentId } }))) setDocumentOptions(null);
  }
  async function linkUploaded(document: DocumentItem) {
    setUpload(null); setBusy(true); setError(null);
    try { await apiRequest(`${base}/documents`, { method: "POST", body: { documentId: document.id } }); await refresh(); onChanged(); }
    catch (caught) { setError(`El archivo se guardó en el repositorio, pero no se pudo vincular: ${describeError(caught)}. Puedes volver a vincularlo como documento existente.`); }
    finally { setBusy(false); }
  }
  if (upload) return <div className="space-y-4"><p className="text-sm text-hub-muted">Sube la evidencia mediante Gestión documental. Después se vinculará a esta actividad conservando su nivel de acceso.</p><DocumentForm scope={event.projectId ? "project" : "institutional"} projectId={event.projectId ?? undefined} limits={upload} onSaved={document => { void linkUploaded(document); }} onCancel={() => setUpload(null)} /></div>;
  return <div className="space-y-6">
    {error && <Alert tone="error">{error}</Alert>}
    <div className="flex flex-wrap gap-2"><Badge>{EVENT_TYPES[event.type]}</Badge><Badge>{EVENT_STATUSES[event.status]}</Badge><Badge>{EVENT_MODES[event.mode]}</Badge></div>
    <dl className="space-y-3 text-sm">
      <div><dt className="text-hub-muted">Inicio · Bogotá</dt><dd>{formatDateTime(event.startsAt)}</dd></div><div><dt className="text-hub-muted">Final · Bogotá</dt><dd>{formatDateTime(event.endsAt)}</dd></div>
      <div><dt className="text-hub-muted">Organizador responsable</dt><dd>{event.organizer.fullName}</dd></div>
      {event.description && <div><dt className="text-hub-muted">Descripción</dt><dd className="whitespace-pre-wrap break-words">{event.description}</dd></div>}
      {event.location && <div><dt className="text-hub-muted">Ubicación</dt><dd className="break-words">{event.location}</dd></div>}
      {eventUrl && <div><dt className="text-hub-muted">Enlace</dt><dd><a className="break-all text-hub-accent underline" target="_blank" rel="noopener noreferrer" href={eventUrl}>Abrir enlace de la actividad (nueva pestaña)</a></dd></div>}
      {event.project && <div><dt className="text-hub-muted">Proyecto</dt><dd><Link className="text-hub-accent underline" href={`/hub/proyectos/${event.project.id}/actividades`}>{event.project.name}</Link></dd></div>}
      {event.externalOrganizer && <div><dt className="text-hub-muted">Organizador externo</dt><dd>{event.externalOrganizer}</dd></div>}
      {event.requirements && <div><dt className="text-hub-muted">Requisitos de convocatoria</dt><dd className="whitespace-pre-wrap break-words">{event.requirements}</dd></div>}
      {registrationUrl && <div><dt className="text-hub-muted">Inscripción externa</dt><dd><a className="text-hub-accent underline" href={registrationUrl} target="_blank" rel="noopener noreferrer">Consultar convocatoria (nueva pestaña)</a></dd></div>}
      {event.cancellationReason && <div><dt className="text-hub-muted">Motivo de cancelación</dt><dd>{event.cancellationReason}</dd></div>}
    </dl>
    <div className="flex flex-wrap gap-2">
      {permissions.canEdit && <Button variant="neutral" disabled={busy} onClick={() => onEdit(event)}>Editar actividad</Button>}
      {permissions.allowedTransitions.map(status => <Button key={status} variant="neutral" disabled={busy} onClick={() => setConfirmation({ path: `${base}/status`, method: "POST", status, message: status === "completed" ? "¿Finalizar la actividad? La asistencia no se confirma automáticamente." : status === "cancelled" ? "¿Cancelar la actividad conservando sus participantes y evidencias?" : "¿Iniciar la actividad?" })}>{status === "completed" ? "Finalizar" : status === "cancelled" ? "Cancelar actividad" : "Iniciar"}</Button>)}
      {permissions.canDelete && <Button variant="neutral" disabled={busy} onClick={() => setConfirmation({ path: base, method: "DELETE", closes: true, message: "¿Eliminar esta actividad programada sin otros participantes ni evidencias?" })}>Eliminar actividad</Button>}
    </div>
    {confirmation && <form ref={confirmationRef} onSubmit={confirm} className="space-y-3 rounded-xl border border-hub-border p-4"><p className="text-sm">{confirmation.message}</p>{confirmation.status === "cancelled" && <FormField label="Motivo de cancelación" name="reason" required maxLength={1000} />}<div className="flex gap-2"><Button type="submit" pending={busy}>Confirmar</Button><Button variant="neutral" disabled={busy} onClick={() => setConfirmation(null)}>Volver</Button></div></form>}
    <section className="border-t border-hub-border pt-4"><h3 className="font-semibold">Participantes y asistencia</h3><p className="mt-1 text-sm text-hub-muted">{data.participants.total} inscritos. La asistencia es opcional y solo la coordinación puede confirmarla.</p>
      {permissions.canManageParticipants && <Button variant="neutral" disabled={busy} className="mt-3" onClick={() => void showPeople()}>Agregar participante</Button>}
      {people && <form onSubmit={register} className="mt-3 space-y-3 rounded-xl border border-hub-border p-3"><label htmlFor={`${id}-person`} className="block text-sm">Integrante activo</label><OptionSelect id={`${id}-person`} name="userId" defaultValue="none" options={[{ value: "none", label: "Selecciona un integrante" }, ...people.map(p => ({ value: p.id, label: p.fullName }))]} /><label htmlFor={`${id}-role`} className="block text-sm">Rol en la actividad</label><OptionSelect id={`${id}-role`} name="role" defaultValue="participant" options={options(PARTICIPANT_ROLES)} /><div className="flex gap-2"><Button type="submit" pending={busy}>Registrar</Button><Button variant="neutral" disabled={busy} onClick={() => setPeople(null)}>Cerrar registro</Button></div></form>}
      <ul className="mt-3 divide-y divide-hub-border">{data.participants.items.map(p => <li key={p.userId} className="space-y-2 py-3"><div className="flex flex-wrap justify-between gap-2"><span className="break-words text-sm font-medium">{p.fullName}</span><Badge>{PARTICIPANT_ROLES[p.role]}</Badge></div>
        {permissions.canRecordAttendance ? <OptionSelect id={`${id}-attendance-${p.userId}`} aria-label={`Asistencia de ${p.fullName}`} value={p.attendance} options={options(ATTENDANCE_STATUSES)} disabled={busy} onValueChange={attendance => { void run(() => apiRequest(`${base}/participants/${p.userId}/attendance`, { method: "PATCH", body: { attendance } })); }} /> : <p className="text-sm text-hub-muted">{ATTENDANCE_STATUSES[p.attendance]}</p>}
        {p.recordedAt && <p className="text-xs text-hub-muted">Último registro: {formatDateTime(p.recordedAt)}</p>}
        {permissions.canManageParticipants && p.userId !== event.organizerId && p.attendance === "registered" && <Button variant="neutral" disabled={busy} onClick={() => setConfirmation({ path: `${base}/participants/${p.userId}`, method: "DELETE", message: `¿Retirar la inscripción de ${p.fullName}?` })}>Retirar inscripción</Button>}
      </li>)}</ul>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm"><span>Página {data.participants.page} de {Math.max(1, Math.ceil(data.participants.total / data.participants.pageSize))}</span><div className="flex gap-2"><Button variant="neutral" disabled={busy || data.participants.page === 1} onClick={() => { void participantPage(data.participants.page - 1); }}>Anterior</Button><Button variant="neutral" disabled={busy || data.participants.page * data.participants.pageSize >= data.participants.total} onClick={() => { void participantPage(data.participants.page + 1); }}>Siguiente</Button></div></div>
    </section>
    <section className="border-t border-hub-border pt-4"><h3 className="font-semibold">Evidencias y certificados</h3><p className="mt-1 text-sm text-hub-muted">Archivos de Gestión documental que puedes consultar. Vincularlos no modifica sus permisos.</p>
      <div className="mt-3 flex flex-wrap gap-2">{permissions.canManageEvidence && <Button variant="neutral" disabled={busy} onClick={() => void showDocumentOptions()}>Vincular documento existente</Button>}{permissions.canUploadEvidence && <Button variant="neutral" disabled={busy} onClick={() => void showDocumentOptions(true)}>Subir evidencia</Button>}</div>
      {documentOptions && <form onSubmit={linkExisting} className="mt-3 space-y-3"><label htmlFor={`${id}-document`} className="block text-sm">Documento del mismo ámbito</label><OptionSelect id={`${id}-document`} name="documentId" defaultValue="none" options={[{ value: "none", label: "Selecciona un documento" }, ...documentOptions.filter(d => !data.documents.some(link => link.id === d.id)).map(d => ({ value: d.id, label: d.title }))]} /><div className="flex gap-2"><Button type="submit" pending={busy}>Vincular</Button><Button variant="neutral" disabled={busy} onClick={() => setDocumentOptions(null)}>Cerrar selección</Button></div></form>}
      {data.documents.length ? <ul className="mt-3 space-y-3">{data.documents.map(d => <li key={d.id} className="flex flex-wrap items-center justify-between gap-2"><a href={`/api/v1/documents/${d.id}/download`} className="inline-flex min-h-11 items-center break-words text-sm text-hub-accent underline">{d.title}</a>{permissions.canManageEvidence && <Button variant="neutral" disabled={busy} onClick={() => setConfirmation({ path: `${base}/documents/${d.id}`, method: "DELETE", message: "¿Desvincular el documento de esta actividad? El archivo se conserva en el repositorio." })}>Desvincular</Button>}</li>)}</ul> : <p className="mt-3 text-sm text-hub-muted">Sin evidencias visibles.</p>}
    </section>
    {busy && <p role="status" className="text-sm text-hub-muted">Procesando…</p>}
  </div>;
}
