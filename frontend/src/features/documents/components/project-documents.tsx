"use client";

import { ArrowRight, ArrowUpDown, Download, Link2, LoaderCircle, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ProjectPageHeader } from "@/features/projects/components/project-page-header";
import { formatCalendarDate, type ProjectDetail, type ProjectTabCounts } from "@/features/projects/types";
import { eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { plural } from "@/features/tracking/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { bogotaDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  ACCESS_LABELS,
  ACCESS_LEVELS,
  CATEGORIES,
  CATEGORY_LABELS,
  DOCUMENT_SORT_LABELS,
  NO_DOCUMENT_FILTER,
  type AccessLevel,
  type DocumentCategory,
  type DocumentFilter,
  type DocumentItem,
  type DocumentList,
  type DocumentSort,
  documentTotals,
  downloadHref,
  fileFamily,
  filterDocuments,
  formatBytes,
  isFiltering,
} from "../types";
import { DocumentForm } from "./document-form";
import { ACCESS_STYLE, FILE_STYLE, iconButton, primaryButton } from "./document-ui";

const controlClass =
  "min-h-9 max-w-56 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

type ProjectDocumentsProps = {
  project: Pick<ProjectDetail, "id" | "name" | "status" | "methodology" | "type">;
  tabCounts: ProjectTabCounts;
  documents: DocumentList;
  /** Resultados del proyecto a los que se puede vincular un documento. */
  results: { id: string; title: string }[];
};

/** Documentos de un proyecto: indicadores, busqueda, filtros y carga, edicion y descarga (F3-09). */
export function ProjectDocuments({ project, tabCounts, documents, results }: ProjectDocumentsProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<DocumentFilter>(NO_DOCUMENT_FILTER);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { items, upload: limits } = documents;
  const finished = project.status === "completed" || project.status === "cancelled";
  const canUpload = Boolean(documents.permissions.canUpload);
  const visible = filterDocuments(items, filter);
  const totals = documentTotals(items);
  const usedCategories = CATEGORIES.filter((category) => totals.byCategory[category] > 0);
  const linked = items.filter((item) => item.researchResult).length;
  const patch = (change: Partial<DocumentFilter>) => setFilter((current) => ({ ...current, ...change }));

  /** El detalle trae las personas autorizadas, que la lista no incluye. */
  async function openEdit(document: DocumentItem) {
    setLoadingEdit(document.id);
    setError(null);

    try {
      setEditing(await apiRequest<DocumentItem>(`/documents/${document.id}`));
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setLoadingEdit(null);
    }
  }

  async function remove(document: DocumentItem) {
    setBusy(true);
    setError(null);

    try {
      await apiRequest(`/documents/${document.id}`, { method: "DELETE" });
      setConfirmDelete(null);
      router.refresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectPageHeader
        project={project}
        current="documentos"
        crumb="Documentos"
        meta={
          <span className="text-hub-muted">
            {finished ? "El proyecto está finalizado: los documentos se pueden descargar, pero no cambiar." : "Solo ves los documentos a los que tienes acceso."}
          </span>
        }
        actions={
          canUpload && limits.enabled ? (
            <button type="button" onClick={() => setUploading(true)} aria-haspopup="dialog" className={primaryButton}>
              <Upload aria-hidden="true" className="size-4" />
              Subir documento
            </button>
          ) : undefined
        }
        counts={tabCounts}
      />

      {canUpload && !limits.enabled && <Alert tone="info">El almacenamiento de documentos no está configurado en este entorno.</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <dl aria-label="Indicadores de documentos" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Documentos" value={documents.total} hint={linked > 0 ? `${plural(linked, "vinculado", "vinculados")} a resultados` : "Ninguno vinculado a resultados"} />
        <Kpi
          label="Tipos"
          value={usedCategories.length}
          hint={usedCategories.length > 0 ? usedCategories.map((category) => `${CATEGORY_LABELS[category]} ${totals.byCategory[category]}`).join(" · ") : "Sin documentos"}
        />
        <Kpi
          label="Acceso"
          value={`${totals.byAccess.general} general`}
          hint={`${plural(totals.byAccess.restricted, "restringido", "restringidos")} · ${plural(totals.byAccess.private, "privado", "privados")}`}
          segments={items.length > 0 ? ACCESS_LEVELS.map((level) => ({ className: ACCESS_STYLE[level].bar, share: totals.byAccess[level] / items.length })) : undefined}
        />
        <Kpi
          label="Espacio"
          value={formatBytes(totals.bytes)}
          hint={totals.latest ? `Último: ${formatCalendarDate(bogotaDay(totals.latest.createdAt))} · ${totals.latest.title}` : "Sin documentos"}
        />
      </dl>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
          Aún no hay documentos en este proyecto que puedas consultar.
        </p>
      ) : (
        <>
          <div className={`${panelCard} flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between`}>
            <label className="relative block min-w-0 flex-1 lg:max-w-md">
              <span className="sr-only">Buscar documentos</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-hub-muted" />
              <input
                type="search"
                value={filter.text}
                onChange={(event) => patch({ text: event.target.value })}
                placeholder="Buscar por título, archivo o autor"
                className={`${controlClass} w-full max-w-none pl-9`}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-hub-muted">
                Tipo
                <select value={filter.category} onChange={(event) => patch({ category: event.target.value as DocumentCategory | "all" })} className={controlClass}>
                  <option value="all">Todos</option>
                  {usedCategories.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]} ({totals.byCategory[category]})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-hub-muted">
                Acceso
                <select value={filter.access} onChange={(event) => patch({ access: event.target.value as AccessLevel | "all" })} className={controlClass}>
                  <option value="all">Todos</option>
                  {ACCESS_LEVELS.filter((level) => totals.byAccess[level] > 0).map((level) => (
                    <option key={level} value={level}>
                      {ACCESS_LABELS[level]} ({totals.byAccess[level]})
                    </option>
                  ))}
                </select>
              </label>
              {results.length > 0 && (
                <label className="flex items-center gap-1.5 text-xs text-hub-muted">
                  Resultado
                  <select value={filter.linked} onChange={(event) => patch({ linked: event.target.value as DocumentFilter["linked"] })} className={controlClass}>
                    <option value="all">Todos</option>
                    <option value="linked">Vinculados</option>
                    <option value="unlinked">Sin vincular</option>
                  </select>
                </label>
              )}
              <label className="flex items-center gap-1.5 text-xs text-hub-muted">
                <ArrowUpDown aria-hidden="true" className="size-4" />
                Orden
                <select value={filter.sort} onChange={(event) => patch({ sort: event.target.value as DocumentSort })} className={controlClass}>
                  {Object.entries(DOCUMENT_SORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {isFiltering(filter) && (
                <button
                  type="button"
                  onClick={() => setFilter({ ...NO_DOCUMENT_FILTER, sort: filter.sort })}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-sm text-hub-muted transition-colors hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                >
                  <X aria-hidden="true" className="size-4" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {plural(visible.length, "documento", "documentos")}
          </p>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">Ningún documento coincide con los filtros.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {visible.map((document) => (
                <DocumentRow
                  key={document.id}
                  document={document}
                  confirming={confirmDelete === document.id}
                  loadingEdit={loadingEdit}
                  busy={busy}
                  onEdit={() => void openEdit(document)}
                  onAskDelete={() => setConfirmDelete(document.id)}
                  onCancelDelete={() => setConfirmDelete(null)}
                  onDelete={() => void remove(document)}
                />
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-hub-muted">
            <p>
              Mostrando {visible.length} de {items.length} documentos
              {documents.total > items.length && ` (los más recientes de ${documents.total})`}
            </p>
            <Link href="/hub/documentos" className="inline-flex items-center gap-1 font-medium text-hub-accent underline-offset-4 hover:underline">
              Repositorio de documentos
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </>
      )}

      <Modal open={uploading} onClose={() => setUploading(false)} title="Subir documento" size="lg">
        {uploading && (
          <DocumentForm
            scope="project"
            projectId={project.id}
            results={results}
            limits={limits}
            onCancel={() => setUploading(false)}
            onSaved={() => {
              setUploading(false);
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Editar documento" size="lg">
        {editing && (
          <DocumentForm
            key={editing.id}
            scope={editing.scope}
            projectId={editing.project?.id}
            results={results}
            limits={limits}
            document={editing}
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

function Kpi({
  label,
  value,
  hint,
  segments,
}: {
  label: string;
  value: string | number;
  hint: string;
  /** Barra segmentada; cada tramo es la proporcion de un nivel (las cifras tambien van en texto). */
  segments?: { className: string; share: number }[];
}) {
  return (
    <div className={`${panelCard} flex min-w-0 flex-col gap-3 p-4`}>
      <dt className={eyebrow}>{label}</dt>
      <dd className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-3xl font-semibold tabular-nums text-hub-text">{value}</span>
        <span className="line-clamp-2 text-xs text-hub-muted">{hint}</span>
        {segments && (
          <span aria-hidden="true" className="mt-1 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-hub-border">
            {segments
              .filter((segment) => segment.share > 0)
              .map((segment) => (
                <span key={segment.className} className={segment.className} style={{ width: `${segment.share * 100}%` }} />
              ))}
          </span>
        )}
      </dd>
    </div>
  );
}

function DocumentRow({
  document,
  confirming,
  loadingEdit,
  busy,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  document: DocumentItem;
  confirming: boolean;
  loadingEdit: string | null;
  busy: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const { icon: Icon, tone } = FILE_STYLE[fileFamily(document.extension)];
  const access = ACCESS_STYLE[document.accessLevel];
  const AccessIcon = access.icon;

  return (
    <li className={`${panelCard} flex min-w-0 flex-col gap-3 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <span aria-hidden="true" className={cn("flex size-12 shrink-0 flex-col items-center justify-center rounded-xl", tone)}>
            <Icon className="size-5" />
            <span className="mt-0.5 text-[9px] font-bold uppercase leading-none">{document.extension}</span>
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="break-words text-base font-semibold text-hub-text">{document.title}</h3>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-hub-muted">
              <span className="max-w-full truncate rounded bg-hub-subtle px-1.5 py-0.5 font-mono text-hub-accent">{document.originalName}</span>
              <span className="font-semibold text-hub-text">{formatBytes(document.sizeBytes)}</span>
              <span aria-hidden="true">·</span>
              <span>
                Subido el {formatCalendarDate(bogotaDay(document.createdAt))}
                {document.uploadedBy && ` por ${document.uploadedBy.fullName}`}
              </span>
            </p>
            {document.description && <p className="line-clamp-2 whitespace-pre-line text-sm text-hub-soft">{document.description}</p>}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className={neutralChip}>{CATEGORY_LABELS[document.category]}</span>
              <span className={`${access.tone} gap-1`}>
                <AccessIcon aria-hidden="true" className="size-3" />
                {ACCESS_LABELS[document.accessLevel]}
              </span>
              {document.researchResult && (
                <span className={`${neutralChip} max-w-full gap-1`}>
                  <Link2 aria-hidden="true" className="size-3 shrink-0 text-hub-accent" />
                  <span className="truncate">Resultado: {document.researchResult.title}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="-mr-1 -mt-1 flex shrink-0 gap-1">
          <a href={downloadHref(document.id)} className={`${iconButton} hover:text-hub-accent`} aria-label={`Descargar ${document.title}`}>
            <Download aria-hidden="true" className="size-4" />
          </a>
          {document.permissions.canEdit && (
            <button type="button" onClick={onEdit} disabled={loadingEdit !== null} aria-haspopup="dialog" className={iconButton} aria-label={`Editar ${document.title}`}>
              {loadingEdit === document.id ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Pencil aria-hidden="true" className="size-4" />
              )}
            </button>
          )}
          {document.permissions.canDelete && (
            <button type="button" onClick={onAskDelete} disabled={busy} className={iconButton} aria-label={`Eliminar ${document.title}`}>
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div className="flex flex-wrap items-center gap-2 border-t border-hub-border pt-3" role="group" aria-label="Confirmar eliminación">
          <p className="text-sm text-hub-text">¿Eliminar el documento y su archivo? No se puede deshacer.</p>
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
