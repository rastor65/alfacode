"use client";

import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/features/projects/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";

import { LINE_STATUS_LABELS, type ResearchLine, type ResearchLineDetail } from "../types";
import { LineForm } from "./line-form";

type LinesCatalogProps = {
  lines: ResearchLine[];
  canManage: boolean;
  /** Mensaje cuando la lista llega vacia (depende de si hay filtros). */
  emptyMessage: string;
};

/** Catalogo de lineas de investigacion (F3-01); alta, detalle y edicion en modales. */
export function LinesCatalog({ lines, canManage, emptyMessage }: LinesCatalogProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ResearchLine | null>(null);
  const [detail, setDetail] = useState<ResearchLineDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Evita que una respuesta tardia pise el detalle de otra linea abierta despues.
  const currentId = useRef<string | null>(null);

  async function open(line: ResearchLine) {
    currentId.current = line.id;
    setSelected(line);
    setDetail(null);
    setDetailError(null);
    setEditing(false);
    setConfirmDelete(false);

    try {
      const loaded = await apiRequest<ResearchLineDetail>(`/research-lines/${line.id}`);
      if (currentId.current === line.id) setDetail(loaded);
    } catch (caught) {
      if (currentId.current === line.id) setDetailError(describeError(caught));
    }
  }

  function close() {
    currentId.current = null;
    setSelected(null);
  }

  async function remove(line: ResearchLineDetail) {
    setDeleting(true);
    setDetailError(null);

    try {
      await apiRequest(`/research-lines/${line.id}`, { method: "DELETE" });
      close();
      router.refresh();
    } catch (caught) {
      setDetailError(describeError(caught));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      {canManage && (
        <Button variant="neutral" className="min-h-10" onClick={() => setCreating(true)} aria-haspopup="dialog">
          <Plus size={16} className="mr-2" aria-hidden="true" />
          Nueva línea
        </Button>
      )}

      {lines.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">{emptyMessage}</p>
      ) : (
        <ul className="mt-5 divide-y divide-hub-border rounded-xl border border-hub-border">
          {lines.map((line) => (
            <li key={line.id}>
              <button
                type="button"
                onClick={() => void open(line)}
                aria-haspopup="dialog"
                className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-hub-text">{line.name}</p>
                  <p className="truncate text-sm text-hub-muted">
                    {line.responsible ? `Responsable: ${line.responsible.fullName}` : "Sin responsable"}
                    {" · "}
                    {line.projectCount === 1 ? "1 proyecto" : `${line.projectCount} proyectos`}
                  </p>
                </div>
                <Badge>{LINE_STATUS_LABELS[line.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva línea de investigación">
        {creating && (
          <LineForm
            onCancel={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal open={selected !== null} onClose={close} title={detail?.name ?? selected?.name ?? "Línea"} size="lg">
        {selected &&
          (!detail ? (
            detailError ? (
              <Alert tone="error">{detailError}</Alert>
            ) : (
              <p className="flex items-center gap-2 text-sm text-hub-muted" role="status">
                <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Cargando…
              </p>
            )
          ) : editing ? (
            <LineForm
              line={detail}
              onCancel={() => setEditing(false)}
              onSaved={(saved) => {
                setDetail({ ...detail, ...saved });
                setEditing(false);
                router.refresh();
              }}
            />
          ) : (
            <div className="space-y-5">
              {detailError && <Alert tone="error">{detailError}</Alert>}
              <div className="flex flex-wrap gap-2">
                <Badge>{LINE_STATUS_LABELS[detail.status]}</Badge>
                <Badge>{detail.responsible ? `Responsable: ${detail.responsible.fullName}` : "Sin responsable"}</Badge>
              </div>
              <TextBlock title="Descripción" text={detail.description} />
              <TextBlock title="Objetivos" text={detail.objectives} />
              <section>
                <h3 className="text-sm font-semibold text-hub-text">Proyectos asociados ({detail.projectCount})</h3>
                {detail.projects.length === 0 ? (
                  <p className="mt-1 text-sm text-hub-muted">
                    {detail.projectCount === 0 ? "Ningún proyecto usa esta línea." : "No participas en los proyectos que usan esta línea."}
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {detail.projects.map((project) => (
                      <li key={project.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <Link
                          href={`/hub/proyectos/${project.id}/investigacion`}
                          className="text-hub-accent underline-offset-4 hover:underline"
                        >
                          {project.name}
                        </Link>
                        <span className="text-hub-muted">
                          {PROJECT_TYPE_LABELS[project.type]} · {PROJECT_STATUS_LABELS[project.status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {detail.projects.length > 0 && detail.projects.length < detail.projectCount && (
                  <p className="mt-2 text-xs text-hub-muted">Solo ves los proyectos en los que participas.</p>
                )}
              </section>

              {detail.permissions.canEdit && (
                <div className="flex flex-wrap gap-2 border-t border-hub-border pt-4">
                  <Button variant="neutral" className="min-h-10" onClick={() => setEditing(true)}>
                    <Pencil size={15} className="mr-2" aria-hidden="true" />
                    Editar
                  </Button>
                  {detail.permissions.canDelete &&
                    (confirmDelete ? (
                      <>
                        <Button className="min-h-10" pending={deleting} pendingLabel="Eliminando…" onClick={() => void remove(detail)}>
                          Confirmar eliminación
                        </Button>
                        <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setConfirmDelete(true)}>
                        <Trash2 size={15} className="mr-2" aria-hidden="true" />
                        Eliminar
                      </Button>
                    ))}
                </div>
              )}
              {detail.permissions.canEdit && !detail.permissions.canDelete && (
                <p className="-mt-3 text-xs text-hub-muted">Una línea con proyectos no se elimina; desactívala desde «Editar».</p>
              )}
            </div>
          ))}
      </Modal>
    </>
  );
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-hub-text">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-sm text-hub-soft">{text || <span className="text-hub-muted">Sin registrar.</span>}</p>
    </section>
  );
}
