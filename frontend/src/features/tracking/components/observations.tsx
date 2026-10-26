"use client";

import { MessageSquareText, Plus, Trash2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { OptionSelect } from "@/components/ui/option-select";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";

import { OBSERVATION_KINDS, type Observation, type ObservationList } from "../types";
import { chip, neutralChip, panelCard } from "./dashboard-ui";

type Action = { kind: "create" } | { kind: "delete"; observation: Observation };

/** Cada tipo lleva etiqueta de texto: el color nunca es la unica senal. */
const KIND_TONE: Record<keyof typeof OBSERVATION_KINDS, string> = {
  progress: `${chip} bg-hub-accent-soft text-hub-accent`,
  difficulty: `${chip} bg-hub-danger-bg text-hub-danger-text`,
  result: `${chip} bg-hub-success-bg text-hub-success-text`,
  general: neutralChip,
};

const primaryButton =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg disabled:opacity-60";
const iconButton =
  "flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-50";
const pagerButton =
  "inline-flex min-h-9 items-center rounded-lg border border-hub-border bg-hub-panel px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-50";

/** F6-05: observaciones cualitativas del proyecto; sin persona evaluada ni puntaje (DEC-046). */
export function Observations({ projectId, initial }: { projectId: string; initial: ObservationList }) {
  const [data, setData] = useState(initial);
  const [action, setAction] = useState<Action | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const base = `/projects/${projectId}/observations`;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  async function load(page: number) {
    setPending(true);
    setError(null);

    try {
      setData(await apiRequest<ObservationList>(`${base}?page=${page}&pageSize=${data.pageSize}`));
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  }

  function close() {
    setAction(null);
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      if (action.kind === "create") await apiRequest(base, { method: "POST", body: { kind: form.get("kind"), body: form.get("body") } });
      else await apiRequest(`${base}/${action.observation.id}`, { method: "DELETE" });
      setAction(null);
      setNotice(action.kind === "create" ? "Observación registrada." : "Observación eliminada.");

      try {
        setData(await apiRequest<ObservationList>(`${base}?page=1&pageSize=${data.pageSize}`));
      } catch (caught) {
        setError(`El cambio se guardó. ${describeError(caught)} Recarga la página para ver la lista actual.`);
      }
    } catch (caught) {
      setError(describeError(caught));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="observations-title" className="flex flex-col gap-4" aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 id="observations-title" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-hub-text">
            <MessageSquareText aria-hidden="true" className="size-5 text-hub-accent" />
            Observaciones de seguimiento
          </h2>
          <span className={`${neutralChip} rounded-full font-mono`}>{data.total}</span>
        </div>
        {data.permissions.canCreate && (
          <button
            type="button"
            aria-haspopup="dialog"
            disabled={pending}
            onClick={() => {
              setNotice(null);
              setAction({ kind: "create" });
            }}
            className={primaryButton}
          >
            <Plus aria-hidden="true" className="size-4" />
            Registrar observación
          </button>
        )}
      </div>
      {notice && <Alert tone="success">{notice}</Alert>}
      {!action && error && <Alert tone="error">{error}</Alert>}
      {data.items.length ? (
        <ol className="flex flex-col gap-3">
          {data.items.map((item) => (
            <li key={item.id} className={`${panelCard} flex min-w-0 flex-col gap-2 p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={KIND_TONE[item.kind]}>{OBSERVATION_KINDS[item.kind]}</span>
                {item.permissions.canDelete && (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    disabled={pending}
                    onClick={() => {
                      setNotice(null);
                      setAction({ kind: "delete", observation: item });
                    }}
                    className={`${iconButton} -mr-2 -mt-2`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    <span className="sr-only">Eliminar observación del {formatDateTime(item.createdAt)}</span>
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-hub-text">{item.body}</p>
              <p className="text-xs text-hub-muted">
                {item.author.fullName ?? "Integrante"} · <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-8 text-center text-sm text-hub-muted">Aún no hay observaciones registradas.</p>
      )}
      {data.total > data.pageSize && (
        <nav aria-label="Paginación de observaciones" className="flex flex-wrap items-center justify-between gap-2 text-sm text-hub-muted">
          <span>
            Página {data.page} de {pages}
          </span>
          <div className="flex gap-2">
            <button type="button" className={pagerButton} disabled={pending || data.page <= 1} onClick={() => void load(data.page - 1)}>
              Anterior
            </button>
            <button type="button" className={pagerButton} disabled={pending || data.page >= pages} onClick={() => void load(data.page + 1)}>
              Siguiente
            </button>
          </div>
        </nav>
      )}
      <Modal open={action !== null} onClose={close} title={action?.kind === "delete" ? "Eliminar observación" : "Registrar observación"} size="lg">
        <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
          {error && (
            <div ref={errorRef} tabIndex={-1}>
              <Alert tone="error">{error}</Alert>
            </div>
          )}
          {action?.kind === "create" && (
            <>
              <div>
                <label htmlFor="observation-kind" className="mb-1 block text-sm font-medium">
                  Tipo
                </label>
                <OptionSelect id="observation-kind" name="kind" defaultValue="progress" disabled={pending} options={Object.entries(OBSERVATION_KINDS).map(([value, label]) => ({ value, label }))} />
              </div>
              <TextAreaField
                label="Observación"
                name="body"
                rows={6}
                required
                minLength={10}
                maxLength={5000}
                disabled={pending}
                hint="Describe el avance, la dificultad o el resultado del proyecto. No incluyas calificaciones ni juicios sobre personas."
              />
            </>
          )}
          {action?.kind === "delete" && <p className="text-sm">Se eliminará la observación del {formatDateTime(action.observation.createdAt)}. Quedará constancia en la auditoría.</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="neutral" onClick={close} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : action?.kind === "delete" ? "Eliminar" : "Registrar"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
