"use client";

import { ArrowRight, Download, Link2, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCalendarDate } from "@/features/projects/types";
import { chip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { bogotaDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  ACCESS_LABELS,
  CATEGORY_LABELS,
  type DocumentItem,
  type UploadLimits,
  accessHint,
  documentOrigin,
  downloadHref,
  fileFamily,
  formatBytes,
} from "../types";
import { DocumentForm } from "./document-form";
import { ACCESS_STYLE, FILE_STYLE, iconButton } from "./document-ui";

type DocumentsListProps = {
  documents: DocumentItem[];
  limits: UploadLimits;
  emptyMessage: string;
};

/** Repositorio: una fila por documento con origen, acceso y acciones; edita y elimina en el sitio (F3-09). */
export function DocumentsList({ documents, limits, emptyMessage }: DocumentsListProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <>
      {error && <Alert tone="error">{error}</Alert>}

      {documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">{emptyMessage}</p>
      ) : (
        <section aria-label="Lista de documentos" className={cn(panelCard, "overflow-hidden")}>
          <div aria-hidden="true" className={cn(eyebrow, "hidden grid-cols-12 items-center gap-4 bg-hub-subtle px-5 py-3 md:grid")}>
            <span className="col-span-5">Documento</span>
            <span className="col-span-3">Origen</span>
            <span className="col-span-2">Acceso</span>
            <span className="col-span-2 text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-hub-border">
            {documents.map((document) => (
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
        </section>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Editar documento" size="lg">
        {editing && (
          <DocumentForm
            key={editing.id}
            scope={editing.scope}
            projectId={editing.project?.id}
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
    </>
  );
}

const originLink = `${chip} max-w-full gap-1 rounded-full py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent`;

/** Origen del documento: institucional, proyecto o adjunto de tramite, con enlace cuando lo hay. */
function Origin({ document }: { document: DocumentItem }) {
  const origin = documentOrigin(document);

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      {origin === "request" ? (
        <Link href={`/hub/tramites/${document.administrativeRequestId}`} className={`${originLink} bg-hub-info-bg text-hub-info-text hover:opacity-80`}>
          <span className="truncate">Adjunto de trámite</span>
          <ArrowRight aria-hidden="true" className="size-3 shrink-0" />
        </Link>
      ) : origin === "project" && document.project ? (
        <Link href={`/hub/proyectos/${document.project.id}/documentos`} className={`${originLink} bg-hub-accent-soft text-hub-accent hover:opacity-80`}>
          <span className="truncate">{document.project.name}</span>
          <ArrowRight aria-hidden="true" className="size-3 shrink-0" />
        </Link>
      ) : (
        <span className={`${chip} gap-1.5 rounded-full bg-hub-accent-soft py-1 text-hub-accent`}>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-hub-accent" />
          Institucional
        </span>
      )}
      <span className="max-w-full truncate text-xs text-hub-muted">
        {origin === "request" ? "Trámite administrativo" : document.researchResult ? `Resultado: ${document.researchResult.title}` : origin === "project" ? "Documento de proyecto" : "Repositorio del semillero"}
      </span>
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
  const isRequest = documentOrigin(document) === "request";

  return (
    <li className="px-5 py-4 transition-colors hover:bg-hub-hover/60">
      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-12 md:gap-4">
        <div className="flex min-w-0 items-start gap-3 md:col-span-5">
          <span aria-hidden="true" className={cn("flex size-11 shrink-0 flex-col items-center justify-center rounded-xl", tone)}>
            <Icon className="size-5" />
            <span className="mt-0.5 text-[9px] font-bold uppercase leading-none">{document.extension}</span>
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="wrap-break-word text-sm font-semibold text-hub-text">{document.title}</h3>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-hub-muted">
              <span className="max-w-full truncate rounded bg-hub-subtle px-1.5 py-0.5 font-mono text-hub-accent">{document.originalName}</span>
              <span className="font-semibold text-hub-text">{formatBytes(document.sizeBytes)}</span>
              <span aria-hidden="true">·</span>
              <span>
                {formatCalendarDate(bogotaDay(document.createdAt))}
                {document.uploadedBy && ` · ${document.uploadedBy.fullName}`}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className={neutralChip}>{CATEGORY_LABELS[document.category]}</span>
              {document.researchResult && (
                <span className={`${neutralChip} max-w-full md:hidden`}>
                  <Link2 aria-hidden="true" className="size-3 shrink-0 text-hub-accent" />
                  <span className="truncate">{document.researchResult.title}</span>
                </span>
              )}
            </div>
            {document.description && <p className="line-clamp-2 whitespace-pre-line text-xs text-hub-soft">{document.description}</p>}
          </div>
        </div>

        <div className="min-w-0 md:col-span-3">
          <Origin document={document} />
        </div>

        <div className="flex min-w-0 flex-col items-start gap-1 md:col-span-2">
          <span className={`${access.tone} gap-1`}>
            <AccessIcon aria-hidden="true" className="size-3" />
            {ACCESS_LABELS[document.accessLevel]}
          </span>
          <span className="text-xs text-hub-muted">{isRequest ? "La persona solicitante y la coordinación." : accessHint(document.accessLevel, document.scope)}</span>
        </div>

        <div className="-ml-1 flex gap-1 md:col-span-2 md:ml-0 md:justify-end">
          <a href={downloadHref(document.id)} className={`${iconButton} hover:text-hub-accent`} aria-label={`Descargar ${document.title}`} title={`Descargar (${formatBytes(document.sizeBytes)})`}>
            <Download aria-hidden="true" className="size-4" />
          </a>
          {document.permissions.canEdit && (
            <button type="button" onClick={onEdit} disabled={loadingEdit !== null} aria-haspopup="dialog" className={iconButton} aria-label={`Editar ${document.title}`} title="Editar">
              {loadingEdit === document.id ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Pencil aria-hidden="true" className="size-4" />
              )}
            </button>
          )}
          {document.permissions.canDelete && (
            <button type="button" onClick={onAskDelete} disabled={busy} className={`${iconButton} hover:bg-hub-danger-bg hover:text-hub-danger-text`} aria-label={`Eliminar ${document.title}`} title="Eliminar">
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hub-border pt-3" role="group" aria-label="Confirmar eliminación">
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
