"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { OptionSelect } from "@/components/ui/option-select";
import { formatCalendarDate } from "@/features/projects/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";

import {
  LINE_STATUS_LABELS,
  PROFILE_FIELDS,
  PROFILE_LABELS,
  type PersonRef,
  type ProjectLines,
  type ProjectProfile,
  RESULT_TYPE_LABELS,
  type ResearchLineList,
  type ResearchResult,
  type ResultList,
  isProfileEmpty,
  linkableLines,
} from "../types";
import { ResultForm } from "./result-form";

const PROFILE_LIMITS: Record<(typeof PROFILE_FIELDS)[number], number> = {
  problem: 10000,
  question: 2000,
  justification: 10000,
  methodology: 10000,
  notes: 10000,
};

type ProjectResearchProps = {
  projectId: string;
  /** El tipo «Investigación» presenta la ficha como parte central; en otros tipos es opcional. */
  researchProject: boolean;
  team: PersonRef[];
  lines: ProjectLines;
  profile: ProjectProfile;
  results: ResultList;
};

/** Informacion investigativa de un proyecto (F3-02 a F3-04, F3-09). */
export function ProjectResearch({ projectId, researchProject, team, lines, profile, results }: ProjectResearchProps) {
  return (
    <div className="space-y-8">
      <LinesSection projectId={projectId} lines={lines} />
      <ProfileSection projectId={projectId} profile={profile} researchProject={researchProject} />
      <ResultsSection projectId={projectId} team={team} results={results} />
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-hub-text">{title}</h2>
      {description && <p className="mt-1 text-sm text-hub-muted">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

// ------------------------------------------------------------------ lineas asociadas (F3-02)

function LinesSection({ projectId, lines }: { projectId: string; lines: ProjectLines }) {
  const router = useRouter();
  const selectId = useId();
  const [candidates, setCandidates] = useState<{ id: string; name: string }[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManage = lines.permissions.canManageLines;

  async function loadCandidates() {
    setError(null);

    try {
      const response = await apiRequest<ResearchLineList>("/research-lines?status=active&pageSize=100");
      setCandidates(linkableLines(response.items, lines.items.map((line) => line.id)));
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    setError(null);

    try {
      await action();
      setCandidates(null);
      router.refresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(null);
    }
  }

  function link(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const researchLineId = String(new FormData(event.currentTarget).get("researchLineId") ?? "");
    void run("link", () => apiRequest(`/projects/${projectId}/research-lines`, { method: "POST", body: { researchLineId } }));
  }

  return (
    <Section title="Líneas de investigación" description="Áreas temáticas en las que se enmarca el proyecto.">
      {error && (
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      )}
      {lines.items.length === 0 ? (
        <p className="text-sm text-hub-muted">El proyecto no tiene líneas asociadas.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {lines.items.map((line) => (
            <li
              key={line.id}
              className="inline-flex items-center gap-1 rounded-full border border-hub-badge-border bg-hub-badge-bg py-1 pl-3 pr-1 text-sm text-hub-badge-text"
            >
              {line.name}
              {line.status === "inactive" && <span className="text-xs text-hub-muted">({LINE_STATUS_LABELS.inactive.toLowerCase()})</span>}
              {canManage ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(`unlink-${line.id}`, () => apiRequest(`/projects/${projectId}/research-lines/${line.id}`, { method: "DELETE" }))
                  }
                  className="flex size-6 items-center justify-center rounded-full text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"
                  aria-label={`Quitar la línea ${line.name}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : (
                <span className="w-2" />
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage &&
        (candidates === null ? (
          <Button variant="neutral" className="mt-3 min-h-10" onClick={() => void loadCandidates()} disabled={busy !== null}>
            <Plus size={15} className="mr-2" aria-hidden="true" />
            Asociar línea
          </Button>
        ) : (
          <form onSubmit={link} className="mt-3 grid gap-3 rounded-xl border border-hub-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            {candidates.length === 0 ? (
              <p className="text-sm text-hub-muted sm:col-span-2">
                No hay más líneas activas para asociar.{" "}
                <Link href="/hub/investigacion" className="text-hub-accent underline-offset-4 hover:underline">
                  Ver el catálogo
                </Link>
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor={selectId} className="block text-sm font-medium text-hub-soft">
                    Línea
                  </label>
                  <OptionSelect
                    id={selectId}
                    name="researchLineId"
                    options={candidates.map((line) => ({ value: line.id, label: line.name }))}
                    defaultValue={candidates[0].id}
                  />
                </div>
                <Button type="submit" className="min-h-11" pending={busy === "link"} pendingLabel="Asociando…">
                  Asociar
                </Button>
              </>
            )}
            <Button variant="ghost" className="w-auto min-h-10 px-4 sm:col-span-2 sm:justify-self-start" onClick={() => setCandidates(null)}>
              Cerrar
            </Button>
          </form>
        ))}
    </Section>
  );
}

// ------------------------------------------------------------------ ficha (F3-03)

function ProfileSection({ projectId, profile, researchProject }: { projectId: string; profile: ProjectProfile; researchProject: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const empty = isProfileEmpty(profile.profile);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, String(form.get(field) ?? "").trim()]).filter(([, value]) => value),
    );

    setPending(true);
    setError(null);

    try {
      await apiRequest(`/projects/${projectId}/research-profile`, { method: "PUT", body });
      setEditing(false);
      router.refresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Section
      title="Ficha investigativa"
      description={
        researchProject
          ? "Problema, pregunta, justificación y metodología del estudio."
          : "Opcional: solo si el proyecto tiene un componente de investigación."
      }
    >
      {editing ? (
        <form onSubmit={save} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          {PROFILE_FIELDS.map((field) => (
            <TextAreaField
              key={field}
              label={`${PROFILE_LABELS[field]} (opcional)`}
              name={field}
              maxLength={PROFILE_LIMITS[field]}
              rows={field === "question" ? 2 : 4}
              defaultValue={profile.profile?.[field] ?? ""}
            />
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="min-h-10" pending={pending} pendingLabel="Guardando…">
              Guardar ficha
            </Button>
            <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setEditing(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <>
          {empty ? (
            <p className="text-sm text-hub-muted">Sin ficha investigativa.</p>
          ) : (
            <dl className="space-y-4 rounded-xl border border-hub-border p-4">
              {PROFILE_FIELDS.filter((field) => profile.profile?.[field]).map((field) => (
                <div key={field}>
                  <dt className="text-sm font-semibold text-hub-text">{PROFILE_LABELS[field]}</dt>
                  <dd className="mt-1 whitespace-pre-line text-sm text-hub-soft">{profile.profile?.[field]}</dd>
                </div>
              ))}
              {profile.profile?.updatedBy && (
                <p className="text-xs text-hub-muted">Última edición: {profile.profile.updatedBy.fullName}</p>
              )}
            </dl>
          )}
          {profile.permissions.canEdit && (
            <Button variant="neutral" className="mt-3 min-h-10" onClick={() => setEditing(true)}>
              <Pencil size={15} className="mr-2" aria-hidden="true" />
              {empty ? "Completar ficha" : "Editar ficha"}
            </Button>
          )}
        </>
      )}
    </Section>
  );
}

// ------------------------------------------------------------------ resultados (F3-04)

function ResultsSection({ projectId, team, results }: { projectId: string; team: PersonRef[]; results: ResultList }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ResearchResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(result: ResearchResult) {
    setBusy(true);
    setError(null);

    try {
      await apiRequest(`/projects/${projectId}/research-results/${result.id}`, { method: "DELETE" });
      setConfirmDelete(null);
      router.refresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={`Resultados (${results.items.length})`} description="Hallazgos, prototipos y aportes del proyecto, con quienes participaron.">
      {error && (
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      )}
      {results.permissions.canManageResults && (
        <Button variant="neutral" className="mb-3 min-h-10" onClick={() => setCreating(true)} aria-haspopup="dialog">
          <Plus size={15} className="mr-2" aria-hidden="true" />
          Registrar resultado
        </Button>
      )}

      {results.items.length === 0 ? (
        <p className="text-sm text-hub-muted">Aún no hay resultados registrados.</p>
      ) : (
        <ul className="space-y-3">
          {results.items.map((result) => (
            <li key={result.id} className="rounded-xl border border-hub-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-hub-text">{result.title}</p>
                  <p className="text-sm text-hub-muted">
                    {RESULT_TYPE_LABELS[result.type]}
                    {result.resultDate && ` · ${formatCalendarDate(result.resultDate)}`}
                  </p>
                </div>
                {result.permissions.canEdit && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(result)}
                      aria-haspopup="dialog"
                      className="flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      aria-label={`Editar ${result.title}`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    {result.permissions.canDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(result.id)}
                        disabled={busy}
                        className="flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"
                        aria-label={`Eliminar ${result.title}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {result.description && <p className="mt-2 whitespace-pre-line text-sm text-hub-soft">{result.description}</p>}
              {result.references && (
                <p className="mt-2 whitespace-pre-line text-sm text-hub-muted">
                  <span className="font-medium text-hub-soft">Referencias: </span>
                  {result.references}
                </p>
              )}
              {result.participants.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.participants.map((person) => (
                    <Badge key={person.userId}>{person.fullName}</Badge>
                  ))}
                </div>
              )}
              {confirmDelete === result.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hub-border pt-3" role="group" aria-label="Confirmar eliminación">
                  <p className="text-sm text-hub-text">¿Eliminar este resultado?</p>
                  <Button className="min-h-9" pending={busy} pendingLabel="Eliminando…" onClick={() => void remove(result)}>
                    Eliminar
                  </Button>
                  <Button variant="ghost" className="w-auto min-h-9 px-4" onClick={() => setConfirmDelete(null)} disabled={busy}>
                    Cancelar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Registrar resultado" size="lg">
        {creating && (
          <ResultForm
            projectId={projectId}
            team={team}
            onCancel={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Editar resultado" size="lg">
        {editing && (
          <ResultForm
            key={editing.id}
            projectId={projectId}
            team={team}
            result={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </Modal>
    </Section>
  );
}
