"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { OptionSelect } from "@/components/ui/option-select";
import { acceptAttribute, checkFile, downloadHref, formatBytes, type DocumentItem } from "@/features/documents/types";
import { apiRequest, apiUpload } from "@/lib/api/client";
import { allItems } from "@/lib/api/all-items";
import { describeError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { BLOCKER_LABELS, HISTORY_LABELS, knownKey, REQUEST_STATUSES, REQUEST_TYPES, type AttachmentList, type Blocker, type HistoryItem, type Page, type Person, type RequestItem, type RequestStatus } from "../types";

type Action = { kind: "status"; status: RequestStatus } | { kind: "reviewer" } | { kind: "withdrawal" } | { kind: "upload" } | { kind: "delete"; document: DocumentItem };
type Initial = { row: RequestItem; history: Page<HistoryItem>; attachments: AttachmentList };
const STATUS_ACTIONS: Partial<Record<RequestStatus, string>> = { in_review: "Iniciar revisión", approved: "Aprobar", rejected: "Rechazar", completed: "Registrar ejecución" };

function Pagination({ page, onPage, disabled, label }: { page: Page<unknown>; onPage: (page: number) => void; disabled: boolean; label: string }) {
  return <nav aria-label={label} className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-hub-muted"><span>{page.total} registros · Página {page.page} de {Math.max(1, Math.ceil(page.total / page.pageSize))}</span><div className="flex gap-2"><Button type="button" variant="neutral" disabled={disabled || page.page <= 1} onClick={() => onPage(page.page - 1)}>Anterior</Button><Button type="button" variant="neutral" disabled={disabled || page.page * page.pageSize >= page.total} onClick={() => onPage(page.page + 1)}>Siguiente</Button></div></nav>;
}

export function RequestDetail({ initial }: { initial: Initial }) {
  const [row, setRow] = useState(initial.row), [history, setHistory] = useState(initial.history), [attachments, setAttachments] = useState(initial.attachments);
  const [action, setAction] = useState<Action | null>(null), [reviewers, setReviewers] = useState<Person[]>([]), [blockers, setBlockers] = useState<Page<Blocker> | null>(null);
  const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null), [notice, setNotice] = useState<string | null>(null);
  const modalRequest = useRef(0), errorRef = useRef<HTMLDivElement>(null), base = `/administrative-requests/${row.id}`;
  function close() { ++modalRequest.current; setAction(null); setError(null); }
  async function refresh() {
    const [nextRow, nextHistory, nextAttachments] = await Promise.all([
      apiRequest<RequestItem>(base), apiRequest<Page<HistoryItem>>(`${base}/history?pageSize=20`), apiRequest<AttachmentList>(`${base}/documents?pageSize=20`),
    ]); setRow(nextRow); setHistory(nextHistory); setAttachments(nextAttachments);
  }
  async function open(next: Action) {
    const token = ++modalRequest.current; setAction(next); setError(null); setNotice(null); setBlockers(null); setReviewers([]);
    if (next.kind !== "reviewer" && next.kind !== "withdrawal") return;
    setPending(true);
    try {
      if (next.kind === "reviewer") { const people = await allItems<Person>("/administrative-requests/reviewers"); if (modalRequest.current === token) setReviewers(people.filter(p => p.id !== row.requesterId)); }
      else { const data = await apiRequest<Page<Blocker>>(`${base}/withdrawal`); if (modalRequest.current === token) setBlockers(data); }
    } catch (caught) { if (modalRequest.current === token) setError(describeError(caught)); }
    finally { setPending(false); }
  }
  async function paginate(kind: "history" | "documents" | "withdrawal", page: number) {
    setPending(true); setError(null);
    try {
      if (kind === "history") setHistory(await apiRequest<Page<HistoryItem>>(`${base}/history?page=${page}&pageSize=20`));
      if (kind === "documents") setAttachments(await apiRequest<AttachmentList>(`${base}/documents?page=${page}&pageSize=20`));
      if (kind === "withdrawal") setBlockers(await apiRequest<Page<Blocker>>(`${base}/withdrawal?page=${page}&pageSize=20`));
    } catch (caught) { setError(describeError(caught)); } finally { setPending(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!action || pending) return;
    const data = new FormData(event.currentTarget), form = event.currentTarget;
    setPending(true); setError(null);
    try {
      if (action.kind === "status") await apiRequest(`${base}/status`, { method: "POST", body: { status: action.status, response: data.get("response") || undefined } });
      if (action.kind === "reviewer") {
        const reviewerId = data.get("reviewerId"); if (!reviewerId || reviewerId === "none") throw new Error("reviewer-required");
        await apiRequest(`${base}/reviewer`, { method: "PATCH", body: { reviewerId } });
      }
      if (action.kind === "withdrawal") await apiRequest(`${base}/withdrawal`, { method: "POST", body: { requesterId: row.requesterId, response: data.get("response") } });
      if (action.kind === "delete") await apiRequest(`/documents/${action.document.id}`, { method: "DELETE" });
      if (action.kind === "upload") {
        const file = data.get("file"), problem = file instanceof File && file.name ? checkFile(file, attachments.upload) : "Adjunta un archivo.";
        if (problem) { setError(problem); form.querySelector<HTMLInputElement>('input[type="file"]')?.focus(); return; }
        const upload = new FormData(); upload.append("file", file as File); upload.append("category", "administrative");
        const title = String(data.get("title") ?? "").trim(); if (title) upload.append("title", title);
        await apiUpload(`${base}/documents`, upload);
      }
      // Una escritura confirmada no se vuelve a enviar si falla solo la recarga posterior.
      close(); setNotice("Cambio guardado.");
      try { await refresh(); } catch (caught) { setError(`El cambio se guardó. ${describeError(caught)} Recarga la página para consultar el estado actual.`); }
    } catch (caught) {
      setError(caught instanceof Error && caught.message === "reviewer-required" ? "Elige una autoridad responsable." : describeError(caught));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setPending(false); }
  }
  const title = !action ? "Trámite" : action.kind === "status" ? STATUS_ACTIONS[action.status] ?? "Actualizar estado" : action.kind === "reviewer" ? "Asignar responsable" : action.kind === "withdrawal" ? "Ejecutar desvinculación" : action.kind === "upload" ? "Adjuntar soporte" : "Eliminar adjunto";
  return <div className="space-y-6" aria-busy={pending}>
    {!action && error && <Alert tone="error">{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}
    <section className="space-y-3 rounded-xl border border-hub-border p-4"><div className="flex flex-wrap items-center gap-3"><Badge>{REQUEST_STATUSES[row.status]}</Badge><span className="text-sm text-hub-muted">{REQUEST_TYPES[row.type]}</span></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-hub-muted">Solicitante</dt><dd className="break-words">{row.requester.fullName}</dd></div><div><dt className="text-hub-muted">Responsable</dt><dd className="break-words">{row.reviewer?.fullName ?? "Sin asignar"}</dd></div><div><dt className="text-hub-muted">Registro</dt><dd>{formatDateTime(row.createdAt)}</dd></div></dl><p className="whitespace-pre-wrap break-words text-sm">{row.description}</p></section>
    {row.response && <section><h2 className="font-semibold">Última respuesta</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.response}</p>{row.decisionBy && <p className="mt-2 text-xs text-hub-muted">Decisión: {row.decisionBy.fullName} · {formatDateTime(row.reviewedAt!)}</p>}{row.executionBy && <p className="mt-1 text-xs text-hub-muted">Ejecución: {row.executionBy.fullName} · {formatDateTime(row.completedAt!)}</p>}</section>}
    <div className="flex flex-wrap gap-3">
      {row.permissions.canAssign && <Button variant="neutral" disabled={pending} aria-haspopup="dialog" onClick={() => void open({ kind: "reviewer" })}>Asignar responsable</Button>}
      {row.permissions.allowedTransitions.map(status => <Button key={status} variant="neutral" disabled={pending} aria-haspopup="dialog" onClick={() => void open({ kind: "status", status })}>{STATUS_ACTIONS[status]}</Button>)}
      {row.permissions.canWithdraw && <Button variant="neutral" disabled={pending} aria-haspopup="dialog" onClick={() => void open({ kind: "withdrawal" })}>Revisar y ejecutar desvinculación</Button>}
    </div>
    {row.type === "withdrawal" && row.status === "approved" && <Alert>La aprobación no desactiva la cuenta. Una autoridad con permiso debe revisar las responsabilidades y ejecutar la salida.</Alert>}
    <section><h2 className="font-semibold">Adjuntos privados</h2><p className="mb-3 mt-1 text-sm text-hub-muted">Solo el solicitante y las autoridades pueden consultarlos. No se comparten con otros integrantes.</p>
      {row.permissions.canAttach && <Button variant="neutral" disabled={pending || !attachments.upload.enabled} aria-haspopup="dialog" onClick={() => void open({ kind: "upload" })}>Adjuntar soporte</Button>}
      {!attachments.upload.enabled && <p className="mt-2 text-sm text-hub-muted">La carga de archivos no está disponible en este entorno.</p>}
      {attachments.items.length ? <ul className="mt-3 divide-y divide-hub-border">{attachments.items.map(doc => <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0 flex-1"><a href={downloadHref(doc.id)} className="block break-words text-sm text-hub-accent underline">{doc.title}</a><span className="text-xs text-hub-muted">{formatBytes(doc.sizeBytes)} · {doc.uploadedBy?.fullName ?? "Integrante"}</span></div>{doc.permissions.canDelete && <Button variant="neutral" disabled={pending} onClick={() => void open({ kind: "delete", document: doc })} aria-haspopup="dialog">Eliminar</Button>}</li>)}</ul> : <p className="mt-3 text-sm text-hub-muted">Sin adjuntos.</p>}
      <Pagination page={attachments} onPage={p => void paginate("documents", p)} disabled={pending} label="Paginación de adjuntos" />
    </section>
    <section><h2 className="font-semibold">Historial del trámite</h2><ol className="mt-3 space-y-4">{history.items.map(item => {
      const status = knownKey(REQUEST_STATUSES, item.details?.to);
      return <li key={item.id} className="rounded-xl border border-hub-border p-3"><p className="text-sm font-medium">{HISTORY_LABELS[item.action] ?? "Actualización"}{status ? ` · ${REQUEST_STATUSES[status]}` : ""}</p><p className="mt-1 text-xs text-hub-muted">{item.actor?.fullName ?? "Sistema"} · {formatDateTime(item.createdAt)}</p>{item.details?.response && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.details.response}</p>}{item.details?.title && <p className="mt-1 break-words text-sm">{item.details.title}</p>}</li>;
    })}</ol><Pagination page={history} onPage={p => void paginate("history", p)} disabled={pending} label="Paginación del historial" /></section>
    <Modal open={action !== null} onClose={close} title={title} size="lg">
      <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
        {error && <div ref={errorRef} tabIndex={-1}><Alert tone="error">{error}</Alert></div>}
        {action?.kind === "status" && <><p className="text-sm">Se registrará el cambio a <strong>{REQUEST_STATUSES[action.status]}</strong> con tu nombre y fecha.</p>{action.status === "completed" && <Alert>Confirma que ejecutaste el trámite. Este registro no genera certificados ni cambia datos o roles automáticamente.</Alert>}<TextAreaField label={action.status === "in_review" ? "Observación (opcional)" : "Respuesta y motivo"} name="response" required={action.status !== "in_review"} maxLength={10000} rows={5} disabled={pending} /></>}
        {action?.kind === "reviewer" && <div><label htmlFor="request-reviewer" className="mb-2 block text-sm">Autoridad responsable</label><OptionSelect id="request-reviewer" name="reviewerId" defaultValue={row.reviewerId ?? "none"} disabled={pending} options={[{ value: "none", label: "Elige una autoridad" }, ...reviewers.map(p => ({ value: p.id, label: p.fullName }))]} /><p className="mt-2 text-sm text-hub-muted">Otra autoridad también puede revisar la solicitud. El solicitante no puede ser su responsable.</p></div>}
        {action?.kind === "withdrawal" && <>
          <Alert>Se desactivará la cuenta de {row.requester.fullName} y se cerrarán sus sesiones. Sus aportes e historial se conservarán.</Alert>
          {pending && !blockers && <p role="status">Consultando responsabilidades…</p>}
          {blockers && <><p className="text-sm font-medium">{blockers.total ? `${blockers.total} responsabilidades pendientes. Reasígnalas con las herramientas existentes antes de ejecutar la salida.` : "No hay responsabilidades abiertas que bloqueen la salida."}</p>{blockers.items.length > 0 && <ul className="space-y-2">{blockers.items.map(b => <li key={`${b.kind}-${b.id}`} className="text-sm"><Link href={b.href} className="break-words text-hub-accent underline">{BLOCKER_LABELS[b.kind]}: {b.label}</Link></li>)}</ul>}<Pagination page={blockers} onPage={p => void paginate("withdrawal", p)} disabled={pending} label="Paginación de responsabilidades" /></>}
          <Button type="button" variant="neutral" disabled={pending} onClick={() => void paginate("withdrawal", 1)}>Actualizar comprobación</Button>
          <TextAreaField label="Motivo y constancia de ejecución" name="response" required minLength={10} maxLength={10000} rows={4} disabled={pending} />
          <label className="flex min-h-11 items-start gap-2 text-sm"><input type="checkbox" required name="confirm" className="mt-1" disabled={pending} />Confirmo la desvinculación de {row.requester.fullName}.</label>
        </>}
        {action?.kind === "upload" && <><p className="text-sm text-hub-muted">Máximo {formatBytes(attachments.upload.maxBytes)}. El archivo se guarda en Gestión documental con acceso privado al trámite.</p><FormField label="Archivo" name="file" type="file" required accept={acceptAttribute(attachments.upload.extensions)} disabled={pending} /><FormField label="Título (opcional)" name="title" minLength={3} maxLength={200} disabled={pending} /></>}
        {action?.kind === "delete" && <p className="break-words text-sm">Se eliminará el archivo <strong>{action.document.title}</strong> y su vínculo con esta solicitud. El historial conservará constancia de la eliminación.</p>}
        <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="neutral" onClick={close} disabled={pending}>Cancelar</Button><Button type="submit" disabled={pending || (action?.kind === "withdrawal" && (!blockers || blockers.total > 0))}>{pending ? "Procesando…" : action?.kind === "withdrawal" ? "Ejecutar desvinculación" : action?.kind === "delete" ? "Eliminar archivo" : "Guardar"}</Button></div>
      </form>
    </Modal>
  </div>;
}
