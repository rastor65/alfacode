"use client";

import { useRef, useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { OptionSelect } from "@/components/ui/option-select";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";

import { OBSERVATION_KINDS, type Observation, type ObservationList } from "../types";

type Action = { kind: "create" } | { kind: "delete"; observation: Observation };

/** F6-05: observaciones cualitativas del proyecto; sin persona evaluada ni puntaje (DEC-046). */
export function Observations({ projectId, initial }: { projectId: string; initial: ObservationList }) {
  const [data, setData] = useState(initial), [action, setAction] = useState<Action | null>(null);
  const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null), [notice, setNotice] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null), base = `/projects/${projectId}/observations`;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  async function load(page: number) {
    setPending(true); setError(null);
    try { setData(await apiRequest<ObservationList>(`${base}?page=${page}&pageSize=${data.pageSize}`)); }
    catch (caught) { setError(describeError(caught)); }
    finally { setPending(false); }
  }
  function close() { setAction(null); setError(null); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!action || pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true); setError(null);
    try {
      if (action.kind === "create") await apiRequest(base, { method: "POST", body: { kind: form.get("kind"), body: form.get("body") } });
      else await apiRequest(`${base}/${action.observation.id}`, { method: "DELETE" });
      setAction(null); setNotice(action.kind === "create" ? "Observación registrada." : "Observación eliminada.");
      try { setData(await apiRequest<ObservationList>(`${base}?page=1&pageSize=${data.pageSize}`)); }
      catch (caught) { setError(`El cambio se guardó. ${describeError(caught)} Recarga la página para ver la lista actual.`); }
    } catch (caught) {
      setError(describeError(caught)); requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setPending(false); }
  }

  return (
    <section aria-labelledby="observations-title" className="space-y-3" aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="observations-title" className="text-base font-semibold">Observaciones de seguimiento</h2>
        {data.permissions.canCreate && <Button variant="neutral" aria-haspopup="dialog" disabled={pending} onClick={() => { setNotice(null); setAction({ kind: "create" }); }}>Registrar observación</Button>}
      </div>
      <p className="text-sm text-hub-muted">Avances, dificultades y resultados del proyecto registrados por su liderazgo o la coordinación. No califican a personas.</p>
      {notice && <Alert tone="success">{notice}</Alert>}
      {!action && error && <Alert tone="error">{error}</Alert>}
      {data.items.length ? (
        <ol className="space-y-3">
          {data.items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-hub-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge>{OBSERVATION_KINDS[item.kind]}</Badge>
                {item.permissions.canDelete && <Button variant="neutral" aria-haspopup="dialog" disabled={pending} onClick={() => { setNotice(null); setAction({ kind: "delete", observation: item }); }}>Eliminar<span className="sr-only"> observación del {formatDateTime(item.createdAt)}</span></Button>}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.body}</p>
              <p className="mt-2 text-xs text-hub-muted">{item.author.fullName ?? "Integrante"} · <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time></p>
            </li>
          ))}
        </ol>
      ) : <p className="rounded-2xl border border-dashed border-hub-border px-4 py-6 text-center text-sm text-hub-muted">Aún no hay observaciones registradas.</p>}
      {data.total > data.pageSize && (
        <nav aria-label="Paginación de observaciones" className="flex flex-wrap items-center justify-between gap-2 text-sm text-hub-muted">
          <span>Página {data.page} de {pages}</span>
          <div className="flex gap-2">
            <Button variant="neutral" disabled={pending || data.page <= 1} onClick={() => void load(data.page - 1)}>Anterior</Button>
            <Button variant="neutral" disabled={pending || data.page >= pages} onClick={() => void load(data.page + 1)}>Siguiente</Button>
          </div>
        </nav>
      )}
      <Modal open={action !== null} onClose={close} title={action?.kind === "delete" ? "Eliminar observación" : "Registrar observación"} size="lg">
        <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
          {error && <div ref={errorRef} tabIndex={-1}><Alert tone="error">{error}</Alert></div>}
          {action?.kind === "create" && <>
            <div><label htmlFor="observation-kind" className="mb-1 block text-sm font-medium">Tipo</label>
              <OptionSelect id="observation-kind" name="kind" defaultValue="progress" disabled={pending} options={Object.entries(OBSERVATION_KINDS).map(([value, label]) => ({ value, label }))} /></div>
            <TextAreaField label="Observación" name="body" rows={6} required minLength={10} maxLength={5000} disabled={pending}
              hint="Describe el avance, la dificultad o el resultado del proyecto. No incluyas calificaciones ni juicios sobre personas." />
          </>}
          {action?.kind === "delete" && <p className="text-sm">Se eliminará la observación del {formatDateTime(action.observation.createdAt)}. Quedará constancia en la auditoría.</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="neutral" onClick={close} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Guardando…" : action?.kind === "delete" ? "Eliminar" : "Registrar"}</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
