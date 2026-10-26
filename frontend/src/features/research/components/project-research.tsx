"use client";

import { ArrowUpDown, Cpu, FileText, FlaskConical, Pencil, Plus, Search, Shapes, Trash2, Unlink, Users, Workflow, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { OptionSelect } from "@/components/ui/option-select";
import { ProjectPageHeader } from "@/features/projects/components/project-page-header";
import { formatCalendarDate, type ProjectDetail, type ProjectTabCounts } from "@/features/projects/types";
import { chip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { plural } from "@/features/tracking/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { formatDateTime, formatShortDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  LINE_STATUS_LABELS,
  PROFILE_FIELDS,
  PROFILE_LABELS,
  RESULT_SORT_LABELS,
  RESULT_TYPES,
  RESULT_TYPE_LABELS,
  type PersonRef,
  type ProjectLines,
  type ProjectProfile,
  type ResearchLineList,
  type ResearchResult,
  type ResearchResultType,
  type ResultList,
  type ResultSort,
  filterResults,
  isProfileEmpty,
  linkableLines,
  profileProgress,
  resultDay,
  resultTypeCounts,
} from "../types";
import { ResultForm } from "./result-form";

const PROFILE_LIMITS: Record<(typeof PROFILE_FIELDS)[number], number> = {
  problem: 10000,
  question: 2000,
  justification: 10000,
  methodology: 10000,
  notes: 10000,
};

/** Cada tipo de resultado lleva icono y texto: el color nunca es la unica senal. */
const RESULT_STYLE: Record<ResearchResultType, { icon: LucideIcon; tone: string }> = {
  finding: { icon: FlaskConical, tone: "bg-hub-info-bg text-hub-info-text" },
  prototype: { icon: Cpu, tone: "bg-hub-accent-soft text-hub-accent" },
  methodological: { icon: Workflow, tone: "bg-hub-success-bg text-hub-success-text" },
  other: { icon: Shapes, tone: "bg-hub-badge-bg text-hub-badge-text" },
};

const controlClass =
  "min-h-9 max-w-56 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";
const toggleClass = (on: boolean) =>
  cn(
    "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
    on ? "bg-hub-accent-soft text-hub-accent ring-1 ring-hub-accent" : "bg-hub-subtle text-hub-soft hover:bg-hub-hover",
  );
const primaryButton =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg";
const quietButton =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hub-border bg-hub-panel px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";
const iconButton =
  "flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-50";

type ProjectResearchProps = {
  project: Pick<ProjectDetail, "id" | "name" | "status" | "methodology" | "type">;
  tabCounts: ProjectTabCounts;
  /** El tipo «Investigación» presenta la ficha como parte central; en otros tipos es opcional. */
  researchProject: boolean;
  team: PersonRef[];
  lines: ProjectLines;
  profile: ProjectProfile;
  results: ResultList;
  /** Documentos del proyecto que la persona puede ver y que estan vinculados a un resultado. */
  resultDocuments?: { id: string; title: string; resultId: string }[];
};

/** Investigacion de un proyecto: ficha, lineas y resultados (F3-02 a F3-04, F3-09). */
export function ProjectResearch({ project, tabCounts, researchProject, team, lines, profile, results, resultDocuments = [] }: ProjectResearchProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ResearchResult | null>(null);
  const finished = project.status === "completed" || project.status === "cancelled";
  const canManageResults = results.permissions.canManageResults;

  return (
    <div className="flex flex-col gap-6">
      <ProjectPageHeader
        project={project}
        current="investigacion"
        crumb="Investigación"
        meta={finished ? <span className="text-hub-muted">El proyecto está finalizado: la información se puede consultar, pero no cambiar.</span> : undefined}
        actions={
          canManageResults ? (
            <button type="button" onClick={() => setCreating(true)} aria-haspopup="dialog" className={primaryButton}>
              <Plus aria-hidden="true" className="size-4" />
              Registrar resultado
            </button>
          ) : undefined
        }
        counts={tabCounts}
      />

      <Indicators lines={lines} profile={profile} results={results.items} />
      <ProfileSection projectId={project.id} profile={profile} researchProject={researchProject} />
      <LinesSection projectId={project.id} lines={lines} />
      <ResultsSection projectId={project.id} results={results} documents={resultDocuments} onEdit={setEditing} />

      <Modal open={creating} onClose={() => setCreating(false)} title="Registrar resultado" size="lg">
        {creating && (
          <ResultForm
            projectId={project.id}
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
            projectId={project.id}
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
    </div>
  );
}

function Kpi({ label, value, hint, bar }: { label: string; value: string | number; hint: string; bar?: number }) {
  return (
    <div className={`${panelCard} flex min-w-0 flex-col gap-3 p-4`}>
      <dt className={eyebrow}>{label}</dt>
      <dd className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-3xl font-semibold tabular-nums text-hub-text">{value}</span>
        <span className="line-clamp-2 text-xs text-hub-muted">{hint}</span>
        {bar !== undefined && (
          <span aria-hidden="true" className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-hub-border">
            <span className="block h-full rounded-full bg-hub-chart" style={{ width: `${bar}%` }} />
          </span>
        )}
      </dd>
    </div>
  );
}

function Indicators({ lines, profile, results }: { lines: ProjectLines; profile: ProjectProfile; results: ResearchResult[] }) {
  const counts = resultTypeCounts(results);
  const breakdown = RESULT_TYPES.filter((type) => counts[type] > 0).map((type) => `${RESULT_TYPE_LABELS[type]} ${counts[type]}`);
  const { filled, total } = profileProgress(profile.profile);
  const latest = filterResults(results, { type: "all", text: "", sort: "recent" })[0];

  return (
    <dl aria-label="Indicadores de investigación" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Resultados" value={results.length} hint={breakdown.length > 0 ? breakdown.join(" · ") : "Aún sin resultados"} />
      <Kpi label="Líneas asociadas" value={lines.items.length} hint={lines.items.length > 0 ? lines.items.map((line) => line.name).join(" · ") : "Sin líneas asociadas"} />
      <Kpi
        label="Ficha investigativa"
        value={`${filled}/${total}`}
        hint={filled === total ? "Todos los campos con texto" : "Campos con texto"}
        bar={Math.round((filled * 100) / total)}
      />
      <Kpi
        label="Último resultado"
        value={latest ? formatShortDay(resultDay(latest)) : "—"}
        hint={latest ? `${RESULT_TYPE_LABELS[latest.type]} · ${latest.title}` : "Sin resultados"}
      />
    </dl>
  );
}

/** Texto largo recortado a unas lineas, con la opcion de verlo completo (el texto siempre esta en la pagina). */
function Clamped({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 360 || text.split("\n").length > 4;

  return (
    <div className="flex flex-col items-start gap-1">
      <p className={cn("whitespace-pre-line text-sm leading-relaxed text-hub-text", long && !open && "line-clamp-4")}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="text-xs font-medium text-hub-accent underline-offset-4 hover:underline">
          {open ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ ficha (F3-03)

function ProfileSection({ projectId, profile, researchProject }: { projectId: string; profile: ProjectProfile; researchProject: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = profile.profile;
  const empty = isProfileEmpty(data);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(PROFILE_FIELDS.map((field) => [field, String(form.get(field) ?? "").trim()]).filter(([, value]) => value));

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

  const callout = (field: (typeof PROFILE_FIELDS)[number], emphasis = false) =>
    data?.[field] ? (
      <div className={cn("flex flex-col gap-1.5 rounded-lg bg-hub-subtle p-4", emphasis && "border-l-4 border-hub-accent")}>
        <h3 className={cn(eyebrow, emphasis && "text-hub-accent")}>{PROFILE_LABELS[field]}</h3>
        {emphasis ? <p className="whitespace-pre-line text-base font-medium leading-relaxed text-hub-text">{data[field]}</p> : <Clamped text={data[field]!} />}
      </div>
    ) : null;

  return (
    <section aria-labelledby="ficha" className={`${panelCard} flex min-w-0 flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="ficha" className="text-lg font-semibold tracking-tight text-hub-text">
            Ficha investigativa
          </h2>
          {data?.updatedBy && !empty && (
            <p className="text-xs text-hub-muted">
              Última edición: {data.updatedBy.fullName} · {formatDateTime(data.updatedAt)}
            </p>
          )}
        </div>
        {profile.permissions.canEdit && (
          <button type="button" onClick={() => setEditing(true)} aria-haspopup="dialog" className={quietButton}>
            <Pencil aria-hidden="true" className="size-4" />
            {empty ? "Completar ficha" : "Editar ficha"}
          </button>
        )}
      </div>

      {empty ? (
        <p className="rounded-lg border border-dashed border-hub-border px-4 py-8 text-center text-sm text-hub-muted">
          Sin ficha investigativa.{!researchProject && " Es opcional en este tipo de proyecto."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {callout("question", true)}
          {callout("problem")}
          {(data?.justification || data?.methodology) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {callout("justification")}
              {callout("methodology")}
            </div>
          )}
          {callout("notes")}
        </div>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Ficha investigativa" size="lg">
        {editing && (
          <form onSubmit={save} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            {PROFILE_FIELDS.map((field) => (
              <TextAreaField
                key={field}
                label={`${PROFILE_LABELS[field]} (opcional)`}
                name={field}
                maxLength={PROFILE_LIMITS[field]}
                rows={field === "question" ? 2 : 4}
                defaultValue={data?.[field] ?? ""}
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
        )}
      </Modal>
    </section>
  );
}

// ------------------------------------------------------------------ lineas asociadas (F3-02)

function LinesSection({ projectId, lines }: { projectId: string; lines: ProjectLines }) {
  const router = useRouter();
  const selectId = useId();
  const [linking, setLinking] = useState(false);
  const [candidates, setCandidates] = useState<{ id: string; name: string }[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManage = lines.permissions.canManageLines;

  async function openLinking() {
    setError(null);
    setCandidates(null);
    setLinking(true);

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
      setLinking(false);
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
    <section aria-labelledby="lineas" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="lineas" className="text-lg font-semibold tracking-tight text-hub-text">
          Líneas de investigación
        </h2>
        {canManage && (
          <button type="button" onClick={() => void openLinking()} aria-haspopup="dialog" className={quietButton}>
            <Plus aria-hidden="true" className="size-4" />
            Asociar línea
          </button>
        )}
      </div>
      {error && !linking && <Alert tone="error">{error}</Alert>}

      {lines.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-8 text-center text-sm text-hub-muted">El proyecto no tiene líneas asociadas.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lines.items.map((line) => (
            <li key={line.id} className={cn(panelCard, "flex items-start justify-between gap-3 p-4", line.status === "inactive" && "opacity-75")}>
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="break-words font-medium text-hub-text">{line.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-hub-muted">
                  <span className={line.status === "active" ? `${chip} bg-hub-accent-soft text-hub-accent` : neutralChip}>{LINE_STATUS_LABELS[line.status]}</span>
                  <span>Asociada el {formatCalendarDate(line.linkedAt.slice(0, 10))}</span>
                </div>
              </div>
              {canManage && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void run(`unlink-${line.id}`, () => apiRequest(`/projects/${projectId}/research-lines/${line.id}`, { method: "DELETE" }))}
                  className={`${iconButton} -mr-1 -mt-1 shrink-0`}
                  aria-label={`Quitar la línea ${line.name}`}
                >
                  <Unlink aria-hidden="true" className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={linking} onClose={() => setLinking(false)} title="Asociar línea">
        {linking &&
          (error ? (
            <Alert tone="error">{error}</Alert>
          ) : candidates === null ? (
            <p className="text-sm text-hub-muted" role="status">
              Cargando…
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-hub-muted">
              No hay más líneas activas para asociar.{" "}
              <Link href="/hub/investigacion" className="text-hub-accent underline-offset-4 hover:underline">
                Ver el catálogo
              </Link>
            </p>
          ) : (
            <form onSubmit={link} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor={selectId} className="block text-sm font-medium text-hub-soft">
                  Línea
                </label>
                <OptionSelect id={selectId} name="researchLineId" options={candidates.map((line) => ({ value: line.id, label: line.name }))} defaultValue={candidates[0].id} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="min-h-10" pending={busy === "link"} pendingLabel="Asociando…">
                  Asociar
                </Button>
                <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setLinking(false)} disabled={busy !== null}>
                  Cancelar
                </Button>
              </div>
            </form>
          ))}
      </Modal>
    </section>
  );
}

// ------------------------------------------------------------------ resultados (F3-04)

function ResultsSection({
  projectId,
  results,
  documents,
  onEdit,
}: {
  projectId: string;
  results: ResultList;
  documents: { id: string; title: string; resultId: string }[];
  onEdit: (result: ResearchResult) => void;
}) {
  const router = useRouter();
  const [type, setType] = useState<ResearchResultType | "all">("all");
  const [text, setText] = useState("");
  const [sort, setSort] = useState<ResultSort>("recent");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const counts = resultTypeCounts(results.items);
  const visible = filterResults(results.items, { type, text, sort });
  const filtering = type !== "all" || text.trim() !== "";

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
    <section aria-labelledby="resultados" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="resultados" className="text-lg font-semibold tracking-tight text-hub-text">
          Resultados
        </h2>
        <span className={`${neutralChip} rounded-full font-mono`}>{results.items.length}</span>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {results.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">Aún no hay resultados registrados.</p>
      ) : (
        <>
          <div className={`${panelCard} flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between`}>
            <label className="relative block min-w-0 flex-1 lg:max-w-md">
              <span className="sr-only">Buscar resultados</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-hub-muted" />
              <input
                type="search"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Buscar por título, texto o participante"
                className={`${controlClass} w-full max-w-none pl-9`}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" aria-pressed={type === "all"} onClick={() => setType("all")} className={toggleClass(type === "all")}>
                Todos
                <span className="rounded-full bg-hub-border px-1.5 font-mono text-[11px] text-hub-text">{results.items.length}</span>
              </button>
              {RESULT_TYPES.filter((option) => counts[option] > 0).map((option) => (
                <button key={option} type="button" aria-pressed={type === option} onClick={() => setType(type === option ? "all" : option)} className={toggleClass(type === option)}>
                  {RESULT_TYPE_LABELS[option]}
                  <span className="rounded-full bg-hub-border px-1.5 font-mono text-[11px] text-hub-text">{counts[option]}</span>
                </button>
              ))}
              <label className="flex items-center gap-1.5 text-xs text-hub-muted">
                <ArrowUpDown aria-hidden="true" className="size-4" />
                Orden
                <select value={sort} onChange={(event) => setSort(event.target.value as ResultSort)} className={controlClass}>
                  {Object.entries(RESULT_SORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {plural(visible.length, "resultado", "resultados")}
          </p>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
              <p>Ningún resultado coincide con la búsqueda.</p>
              {filtering && (
                <button
                  type="button"
                  onClick={() => {
                    setType("all");
                    setText("");
                  }}
                  className="font-medium text-hub-accent underline-offset-4 hover:underline"
                >
                  Quitar filtros
                </button>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {visible.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  documents={documents.filter((document) => document.resultId === result.id)}
                  confirming={confirmDelete === result.id}
                  busy={busy}
                  onEdit={() => onEdit(result)}
                  onAskDelete={() => setConfirmDelete(result.id)}
                  onCancelDelete={() => setConfirmDelete(null)}
                  onDelete={() => void remove(result)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function ResultCard({
  result,
  documents,
  confirming,
  busy,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  result: ResearchResult;
  documents: { id: string; title: string }[];
  confirming: boolean;
  busy: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const { icon: Icon, tone } = RESULT_STYLE[result.type];

  return (
    <li className={`${panelCard} flex min-w-0 flex-col gap-3 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
            <Icon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-hub-muted">
              <span className={cn(chip, tone)}>{RESULT_TYPE_LABELS[result.type]}</span>
              <span>{formatCalendarDate(resultDay(result))}</span>
            </div>
            <h3 className="break-words text-base font-semibold text-hub-text">{result.title}</h3>
          </div>
        </div>
        {result.permissions.canEdit && (
          <div className="-mr-1 -mt-1 flex shrink-0 gap-1">
            <button type="button" onClick={onEdit} aria-haspopup="dialog" className={iconButton} aria-label={`Editar ${result.title}`}>
              <Pencil aria-hidden="true" className="size-4" />
            </button>
            {result.permissions.canDelete && (
              <button type="button" onClick={onAskDelete} disabled={busy} className={iconButton} aria-label={`Eliminar ${result.title}`}>
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {result.description && <p className="whitespace-pre-line text-sm leading-relaxed text-hub-soft">{result.description}</p>}
      {result.references && (
        <p className="whitespace-pre-line text-sm text-hub-muted">
          <span className="font-medium text-hub-soft">Referencias: </span>
          {result.references}
        </p>
      )}

      {(result.participants.length > 0 || documents.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hub-border pt-3">
          {result.participants.length > 0 ? (
            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-hub-muted">
              <Users aria-hidden="true" className="size-4 text-hub-accent" />
              <span className="sr-only">Participantes:</span>
              {result.participants.map((person, index) => (
                <span key={person.userId} className="font-medium text-hub-text">
                  {person.fullName}
                  {index < result.participants.length - 1 && ","}
                </span>
              ))}
            </p>
          ) : (
            <span />
          )}
          {documents.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {documents.map((document) => (
                <li key={document.id}>
                  <a
                    href={`/api/v1/documents/${document.id}/download`}
                    className="inline-flex max-w-64 items-center gap-1.5 rounded-lg bg-hub-subtle px-2.5 py-1 text-xs font-medium text-hub-accent transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                  >
                    <FileText aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="truncate">{document.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {confirming && (
        <div className="flex flex-wrap items-center gap-2 border-t border-hub-border pt-3" role="group" aria-label="Confirmar eliminación">
          <p className="text-sm text-hub-text">¿Eliminar este resultado?</p>
          <Button className="min-h-9" pending={busy} pendingLabel="Eliminando…" onClick={onDelete}>
            Eliminar
          </Button>
          <Button variant="ghost" className="w-auto min-h-9 px-4" onClick={onCancelDelete} disabled={busy}>
            Cancelar
          </Button>
        </div>
      )}
    </li>
  );
}
