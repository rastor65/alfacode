"use client";

import { Download, FileText, Image as ImageIcon, LoaderCircle, Lock, Pencil, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";

import { ACCESS_LABELS, CATEGORY_LABELS, type DocumentItem, type DocumentScope, type UploadLimits, downloadHref, formatBytes } from "../types";
import { DocumentForm } from "./document-form";

type DocumentsListProps = {
  documents: DocumentItem[];
  scope: DocumentScope;
  projectId?: string;
  results?: { id: string; title: string }[];
  limits: UploadLimits;
  canUpload: boolean;
  emptyMessage: string;
  /** En el repositorio se muestra el proyecto de cada documento. */
  showProject?: boolean;
};

const dateFormat = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });

/** Lista de documentos con descarga, carga y edicion en modales (F3-09). */
export function DocumentsList({ documents, scope, projectId, results, limits, canUpload, emptyMessage, showProject = false }: DocumentsListProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
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
      {error && (
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      )}
      {canUpload &&
        (limits.enabled ? (
          <Button variant="neutral" className="mb-4 min-h-10" onClick={() => setUploading(true)} aria-haspopup="dialog">
            <Upload size={15} className="mr-2" aria-hidden="true" />
            Subir documento
          </Button>
        ) : (
          <Alert tone="info" className="mb-4">
            El almacenamiento de documentos no está configurado en este entorno.
          </Alert>
        ))}

      {documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-hub-border rounded-xl border border-hub-border">
          {documents.map((document) => {
            const Icon = document.mimeType.startsWith("image/") ? ImageIcon : FileText;

            return (
              <li key={document.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <Icon size={20} className="mt-0.5 shrink-0 text-hub-muted" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-hub-text">{document.title}</p>
                      <p className="truncate text-sm text-hub-muted">
                        {document.originalName} · {formatBytes(document.sizeBytes)} · {dateFormat.format(new Date(document.createdAt))}
                        {document.uploadedBy && ` · ${document.uploadedBy.fullName}`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge>{CATEGORY_LABELS[document.category]}</Badge>
                        <Badge>
                          {document.accessLevel === "private" && <Lock size={11} className="mr-1" aria-hidden="true" />}
                          {ACCESS_LABELS[document.accessLevel]}
                        </Badge>
                        {showProject && document.project && (
                          <Link
                            href={`/hub/proyectos/${document.project.id}/documentos`}
                            className="inline-flex items-center rounded-full border border-hub-badge-border px-2.5 py-1 text-xs text-hub-accent underline-offset-4 hover:underline"
                          >
                            {document.project.name}
                          </Link>
                        )}
                        {showProject && !document.project && <Badge>Institucional</Badge>}
                        {document.researchResult && <Badge>Resultado: {document.researchResult.title}</Badge>}
                      </div>
                      {document.description && <p className="mt-2 whitespace-pre-line text-sm text-hub-soft">{document.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <a
                      href={downloadHref(document.id)}
                      className="flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      aria-label={`Descargar ${document.title}`}
                    >
                      <Download size={16} aria-hidden="true" />
                    </a>
                    {document.permissions.canEdit && (
                      <button
                        type="button"
                        onClick={() => void openEdit(document)}
                        disabled={loadingEdit !== null}
                        aria-haspopup="dialog"
                        className="flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"
                        aria-label={`Editar ${document.title}`}
                      >
                        {loadingEdit === document.id ? (
                          <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                          <Pencil size={16} aria-hidden="true" />
                        )}
                      </button>
                    )}
                    {document.permissions.canDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(document.id)}
                        disabled={busy}
                        className="flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"
                        aria-label={`Eliminar ${document.title}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
                {confirmDelete === document.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hub-border pt-3" role="group" aria-label="Confirmar eliminación">
                    <p className="text-sm text-hub-text">¿Eliminar el documento y su archivo? No se puede deshacer.</p>
                    <Button className="min-h-9" pending={busy} pendingLabel="Eliminando…" onClick={() => void remove(document)}>
                      Eliminar
                    </Button>
                    <Button variant="ghost" className="w-auto min-h-9 px-4" onClick={() => setConfirmDelete(null)} disabled={busy}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={uploading} onClose={() => setUploading(false)} title="Subir documento" size="lg">
        {uploading && (
          <DocumentForm
            scope={scope}
            projectId={projectId}
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
    </>
  );
}
