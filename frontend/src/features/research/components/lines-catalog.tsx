"use client";

import { ArrowUpRight, FlaskConical, FolderKanban, LoaderCircle, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/features/projects/types";
import { panelCard } from "@/features/tracking/components/dashboard-ui";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col gap-4">
        {canManage && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-hub-muted">
              {lines.length === 1 ? "1 línea mostrada" : `${lines.length} líneas mostradas`}
            </p>
            <Button variant="neutral" className="min-h-10 shadow-xs" onClick={() => setCreating(true)} aria-haspopup="dialog">
              <Plus size={16} className="mr-2 text-hub-accent" aria-hidden="true" />
              Nueva línea de investigación
            </Button>
          </div>
        )}

        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hub-border bg-hub-panel/40 px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-hub-accent-soft text-hub-accent mb-3">
              <FlaskConical className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-hub-text">No se encontraron líneas de investigación</h3>
            <p className="mt-1 max-w-sm text-sm text-hub-muted">{emptyMessage}</p>
            {canManage && (
              <Button variant="neutral" className="mt-5 min-h-10" onClick={() => setCreating(true)}>
                <Plus size={16} className="mr-2" aria-hidden="true" />
                Crear primera línea
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lines.map((line) => (
              <div
                key={line.id}
                onClick={() => void open(line)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void open(line);
                  }
                }}
                aria-haspopup="dialog"
                className={cn(
                  panelCard,
                  "group relative flex flex-col justify-between p-5 text-left cursor-pointer transition-all duration-200",
                  "hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                      <FlaskConical className="size-5" />
                    </span>
                    <Badge className={line.status === "active" ? "bg-hub-accent-soft text-hub-accent border-hub-accent/30" : "bg-hub-subtle text-hub-muted border-hub-border"}>
                      {LINE_STATUS_LABELS[line.status]}
                    </Badge>
                  </div>

                  <h3 className="mt-3 font-semibold text-hub-text group-hover:text-hub-accent transition-colors line-clamp-2">
                    {line.name}
                  </h3>

                  {line.description && (
                    <p className="mt-2 text-xs text-hub-muted line-clamp-2 leading-relaxed">
                      {line.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-hub-border/60 pt-3 text-xs text-hub-soft">
                  <span className="flex items-center gap-1.5 truncate max-w-[12rem]" title={line.responsible ? line.responsible.fullName : "Sin responsable"}>
                    <UserRound className="size-3.5 text-hub-muted shrink-0" />
                    <span className="truncate">
                      {line.responsible ? line.responsible.fullName : "Sin responsable"}
                    </span>
                  </span>

                  <span className="flex items-center gap-1 font-mono text-xs text-hub-muted bg-hub-subtle px-2 py-0.5 rounded-md">
                    <FolderKanban className="size-3 text-hub-accent" />
                    {line.projectCount} {line.projectCount === 1 ? "proyecto" : "proyectos"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                          href={`/hub/proyectos/${project.id}?tab=investigacion`}
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
