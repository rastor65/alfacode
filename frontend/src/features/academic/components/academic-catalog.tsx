"use client";

import { Award, BookOpen, Eye, FileText, Library, Link2, Pencil, PanelTop, Plus, Presentation, Shapes, Terminal, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ProjectPageHeader } from "@/features/projects/components/project-page-header";
import { formatCalendarDate, type ProjectDetail, type ProjectSummary, type ProjectTabCounts } from "@/features/projects/types";
import { chip, dangerChip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { apiRequest } from "@/lib/api/client";
import { allItems } from "@/lib/api/all-items";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { PRODUCT_STATUSES, PRODUCT_TYPES, safeExternalUrl, type AcademicItem, type AcademicKind, type ProductStatus, type ProductType } from "../types";
import { AcademicForm, formContext, type FormOptions } from "./academic-form";

/** Cada tipo de producto lleva icono y nombre: el color nunca es la unica senal. */
const TYPE_ICON: Record<ProductType, LucideIcon> = {
  article: FileText,
  presentation: Presentation,
  poster: PanelTop,
  book_chapter: BookOpen,
  book: Library,
  software: Terminal,
  other: Shapes,
};

const STATUS_CHIP: Record<ProductStatus, string> = {
  in_progress: neutralChip,
  submitted: `${chip} bg-hub-info-bg text-hub-info-text`,
  accepted: `${chip} bg-hub-accent-soft text-hub-accent`,
  published: `${chip} bg-hub-success-bg text-hub-success-text`,
  rejected: dangerChip,
};

const primaryButton =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg";
const iconButton =
  "flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-50";

type AcademicCatalogProps = {
  kind: AcademicKind;
  items: AcademicItem[];
  canCreate: boolean;
  canCreateInstitutional: boolean;
  projectId?: string;
  /** Proyecto de la vista; sin el, es el catalogo institucional. */
  project: Pick<ProjectDetail, "id" | "name" | "status" | "methodology" | "type"> | null;
  tabCounts: ProjectTabCounts;
  /** Indicadores y filtros (los arma el servidor). */
  before: React.ReactNode;
  /** Paginacion (la arma el servidor). */
  after: React.ReactNode;
};

/** Catalogo de produccion y reconocimientos: encabezado, lista, detalle y alta/edicion en modales. */
export function AcademicCatalog({ kind, items, canCreate, canCreateInstitutional, projectId, project, tabCounts, before, after }: AcademicCatalogProps) {
  const router = useRouter();
  const request = useRef(0);
  const [mode, setMode] = useState<"detail" | "form" | null>(null);
  const [selected, setSelected] = useState<AcademicItem | undefined>();
  const [data, setData] = useState<FormOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const recognition = kind === "recognitions";

  function close() {
    ++request.current;
    setMode(null);
    setSelected(undefined);
    setError(null);
    setConfirm(false);
  }

  async function open(item: AcademicItem) {
    const current = ++request.current;
    setMode("detail");
    setSelected(undefined);
    setError(null);
    setConfirm(false);
    setLoading(true);

    try {
      const fresh = await apiRequest<AcademicItem>(`/${kind}/${item.id}`);
      if (current === request.current) setSelected(fresh);
    } catch (caught) {
      if (current === request.current) setError(describeError(caught));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }

  async function form(item?: AcademicItem) {
    const current = ++request.current;
    setMode("form");
    setSelected(item);
    setData(null);
    setError(null);
    setLoading(true);

    try {
      const [projects, context] = await Promise.all([allItems<ProjectSummary>("/projects"), formContext(item?.projectId ?? projectId ?? null)]);
      if (current === request.current) {
        setData({
          projects: projects.filter((p) => !["completed", "cancelled"].includes(p.status) && (canCreateInstitutional || p.myRole === "leader")),
          context,
          institutional: canCreateInstitutional,
        });
      }
    } catch (caught) {
      if (current === request.current) setError(describeError(caught));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }

  async function remove() {
    if (!selected) return;
    setDeleting(true);
    setError(null);

    try {
      await apiRequest(`/${kind}/${selected.id}`, { method: "DELETE" });
      close();
      router.refresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setDeleting(false);
    }
  }

  const external = safeExternalUrl(selected?.url);
  const newButton = canCreate ? (
    <button type="button" onClick={() => void form()} aria-haspopup="dialog" className={primaryButton}>
      <Plus aria-hidden="true" className="size-4" />
      {recognition ? "Nuevo reconocimiento" : "Nuevo producto"}
    </button>
  ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      {project ? (
        <ProjectPageHeader
          project={project}
          current="produccion"
          crumb="Producción"
          actions={newButton}
          counts={tabCounts}
        />
      ) : (
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Producción y reconocimientos</h1>
          {newButton}
        </header>
      )}

      {before}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
          No hay {recognition ? "reconocimientos" : "productos"} para los filtros y permisos actuales.
        </p>
      ) : (
        <div className={`${panelCard} overflow-hidden`}>
          <div className="hidden grid-cols-12 gap-4 border-b border-hub-border bg-hub-subtle px-5 py-3 md:grid">
            <span className={cn(eyebrow, "col-span-5")}>{recognition ? "Reconocimiento" : "Producto / Autores"}</span>
            <span className={cn(eyebrow, "col-span-2")}>{recognition ? "Integrante" : "Tipo"}</span>
            <span className={cn(eyebrow, "col-span-2")}>{recognition ? "Fecha" : "Estado y fecha"}</span>
            <span className={cn(eyebrow, "col-span-2")}>{recognition ? "Evidencia" : project ? "Resultados" : "Proyecto"}</span>
            <span className={cn(eyebrow, "col-span-1 text-right")}>
              <span className="sr-only">Acciones</span>
            </span>
          </div>
          <ul className="divide-y divide-hub-border">
            {items.map((item) => (
              <li key={item.id}>
                {recognition ? (
                  <RecognitionRow item={item} showProject={!project} onOpen={() => void open(item)} onEdit={() => void form(item)} />
                ) : (
                  <ProductRow item={item} showProject={!project} onOpen={() => void open(item)} onEdit={() => void form(item)} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {after}

      <Modal
        open={mode !== null}
        onClose={close}
        size="lg"
        title={mode === "form" ? `${selected ? "Editar" : "Nuevo"} ${recognition ? "reconocimiento" : "producto"}` : (selected?.title ?? "Detalle")}
      >
        {error && (
          <div className="mb-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {loading ? (
          <p role="status" className="text-sm text-hub-muted">
            Cargando…
          </p>
        ) : mode === "form" && data ? (
          <AcademicForm
            kind={kind}
            item={selected}
            initialProjectId={projectId}
            scoped={Boolean(projectId)}
            data={data}
            onCancel={close}
            onSaved={() => {
              close();
              router.refresh();
            }}
          />
        ) : selected && mode === "detail" ? (
          <div className="space-y-5">
            <dl className="space-y-3 text-sm">
              {selected.type && (
                <div>
                  <dt className="text-hub-muted">Tipo</dt>
                  <dd>{PRODUCT_TYPES[selected.type]}</dd>
                </div>
              )}
              {selected.status && (
                <div>
                  <dt className="text-hub-muted">Estado</dt>
                  <dd>{PRODUCT_STATUSES[selected.status]}</dd>
                </div>
              )}
              <div>
                <dt className="text-hub-muted">Fecha</dt>
                <dd>{selected.recognitionDate ?? selected.productDate ?? "Sin fecha"}</dd>
              </div>
              {selected.description && (
                <div>
                  <dt className="text-hub-muted">Descripción</dt>
                  <dd className="whitespace-pre-wrap break-words">{selected.description}</dd>
                </div>
              )}
              {selected.project && (
                <div>
                  <dt className="text-hub-muted">Proyecto</dt>
                  <dd>
                    <Link className="text-hub-accent underline" href={`/hub/proyectos/${selected.project.id}/produccion`}>
                      {selected.project.name}
                    </Link>
                  </dd>
                </div>
              )}
              {selected.user && (
                <div>
                  <dt className="text-hub-muted">Integrante reconocido</dt>
                  <dd>{selected.user.fullName}</dd>
                </div>
              )}
              {selected.source && (
                <div>
                  <dt className="text-hub-muted">Fuente</dt>
                  <dd className="break-words">{selected.source}</dd>
                </div>
              )}
              {selected.doi && (
                <div>
                  <dt className="text-hub-muted">DOI</dt>
                  <dd className="break-all">{selected.doi}</dd>
                </div>
              )}
              {external && (
                <div>
                  <dt className="text-hub-muted">Enlace</dt>
                  <dd>
                    <a href={external} target="_blank" rel="noopener noreferrer" className="break-all text-hub-accent underline">
                      Abrir fuente (nueva pestaña)
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {selected.authors && (
              <section>
                <h3 className="text-sm font-semibold">Autorías</h3>
                <ol className="mt-2 list-inside list-decimal space-y-2 text-sm">
                  {selected.authors.map((a) => (
                    <li key={a.position}>
                      {a.fullName}
                      {!a.userId && " (externo)"}
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {selected.results && selected.results.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold">Resultados asociados</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {selected.results.map((r) => (
                    <li key={r.id}>{r.title}</li>
                  ))}
                </ul>
              </section>
            )}
            {selected.evidence && (
              <a href={`/api/v1/documents/${selected.evidence.id}/download`} className="inline-flex min-h-11 items-center text-sm text-hub-accent underline">
                Descargar evidencia: {selected.evidence.title}
              </a>
            )}
            {selected.permissions.canManage && (
              <div className="border-t border-hub-border pt-4">
                {confirm ? (
                  <div className="space-y-3">
                    <p className="text-sm">¿Eliminar este registro y sus asociaciones? Esta acción no elimina archivos documentales ni cuentas.</p>
                    <div className="flex gap-2">
                      <Button pending={deleting} onClick={() => void remove()}>
                        Eliminar registro
                      </Button>
                      <Button variant="neutral" disabled={deleting} onClick={() => setConfirm(false)}>
                        Conservar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="neutral" onClick={() => void form(selected)}>
                      Editar
                    </Button>
                    <Button variant="neutral" onClick={() => setConfirm(true)}>
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

type RowProps = { item: AcademicItem; showProject: boolean; onOpen: () => void; onEdit: () => void };

function RowActions({ item, onOpen, onEdit }: Pick<RowProps, "item" | "onOpen" | "onEdit">) {
  return (
    <div className="flex items-center justify-end gap-1 md:col-span-1">
      <button type="button" onClick={onOpen} aria-haspopup="dialog" className={iconButton} aria-label={`Ver detalle de ${item.title}`}>
        <Eye aria-hidden="true" className="size-4" />
      </button>
      {item.permissions.canManage && (
        <button type="button" onClick={onEdit} aria-haspopup="dialog" className={iconButton} aria-label={`Editar ${item.title}`}>
          <Pencil aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}

function ProjectLink({ item, showProject }: Pick<RowProps, "item" | "showProject">) {
  if (showProject) {
    return item.project ? (
      <Link href={`/hub/proyectos/${item.project.id}/produccion`} className="line-clamp-2 text-sm text-hub-accent underline-offset-4 hover:underline">
        {item.project.name}
      </Link>
    ) : (
      <span className="text-sm text-hub-muted">Institucional</span>
    );
  }

  return item.results && item.results.length > 0 ? (
    <span className={`${neutralChip} max-w-full gap-1`}>
      <Link2 aria-hidden="true" className="size-3 shrink-0 text-hub-accent" />
      <span className="truncate">{item.results.length === 1 ? item.results[0].title : `${item.results.length} resultados`}</span>
    </span>
  ) : (
    <span className="text-sm text-hub-muted">—</span>
  );
}

function Cell({ label, children, className }: { label: string; children: React.ReactNode; className: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className={`${eyebrow} md:hidden`}>{label}</span>
      {children}
    </div>
  );
}

function ProductRow({ item, showProject, onOpen, onEdit }: RowProps) {
  const type = item.type ?? "other";
  const Icon = TYPE_ICON[type];
  const external = safeExternalUrl(item.url);

  return (
    <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-hub-hover md:grid-cols-12">
      <div className="col-span-2 flex min-w-0 items-start gap-3 md:col-span-5">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
          <Icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <button type="button" onClick={onOpen} aria-haspopup="dialog" className="break-words text-left text-base font-semibold text-hub-text underline-offset-4 hover:text-hub-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
            {item.title}
          </button>
          {item.authors && item.authors.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-hub-muted">
              <Users aria-hidden="true" className="size-3.5 text-hub-accent" />
              <span className="sr-only">Autores:</span>
              {item.authors.map((author, index) => (
                <span key={author.position} className="font-medium text-hub-text">
                  {author.fullName}
                  {!author.userId && <span className="font-normal text-hub-muted"> (externo)</span>}
                  {index < item.authors!.length - 1 && ","}
                </span>
              ))}
            </p>
          )}
          {(item.source || item.doi || external) && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-hub-muted">
              {item.source && <span>{item.source}</span>}
              {item.doi && <span className="rounded bg-hub-subtle px-1.5 py-0.5 font-mono text-hub-accent">DOI: {item.doi}</span>}
              {external && (
                <a href={external} target="_blank" rel="noopener noreferrer" className="text-hub-accent underline-offset-4 hover:underline">
                  Abrir fuente
                </a>
              )}
            </p>
          )}
        </div>
      </div>
      <Cell label="Tipo" className="md:col-span-2">
        <span className="text-sm font-medium text-hub-text">{PRODUCT_TYPES[type]}</span>
      </Cell>
      <Cell label="Estado y fecha" className="md:col-span-2">
        <span className="flex flex-col items-start gap-1">
          {item.status && <span className={STATUS_CHIP[item.status]}>{PRODUCT_STATUSES[item.status]}</span>}
          <span className="text-xs text-hub-muted">{(item.productDate && formatCalendarDate(item.productDate)) || "Sin fecha"}</span>
        </span>
      </Cell>
      <Cell label={showProject ? "Proyecto" : "Resultados"} className="md:col-span-2">
        <ProjectLink item={item} showProject={showProject} />
      </Cell>
      <RowActions item={item} onOpen={onOpen} onEdit={onEdit} />
    </div>
  );
}

function RecognitionRow({ item, showProject, onOpen, onEdit }: RowProps) {
  return (
    <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-hub-hover md:grid-cols-12">
      <div className="col-span-2 flex min-w-0 items-start gap-3 md:col-span-5">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-hub-success-bg text-hub-success-text">
          <Award className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <button type="button" onClick={onOpen} aria-haspopup="dialog" className="break-words text-left text-base font-semibold text-hub-text underline-offset-4 hover:text-hub-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
            {item.title}
          </button>
          {item.description && <p className="line-clamp-2 text-sm text-hub-soft">{item.description}</p>}
          {showProject && item.project && (
            <Link href={`/hub/proyectos/${item.project.id}/produccion`} className="w-fit text-xs text-hub-accent underline-offset-4 hover:underline">
              {item.project.name}
            </Link>
          )}
        </div>
      </div>
      <Cell label="Integrante" className="md:col-span-2">
        <span className="text-sm font-medium text-hub-text">{item.user?.fullName ?? "—"}</span>
      </Cell>
      <Cell label="Fecha" className="md:col-span-2">
        <span className="text-sm text-hub-text">{(item.recognitionDate && formatCalendarDate(item.recognitionDate)) || "Sin fecha"}</span>
      </Cell>
      <Cell label="Evidencia" className="md:col-span-2">
        {item.evidence ? (
          <a href={`/api/v1/documents/${item.evidence.id}/download`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-hub-subtle px-2.5 py-1 text-xs font-medium text-hub-accent hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
            <FileText aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{item.evidence.title}</span>
          </a>
        ) : (
          <span className="text-sm text-hub-muted">—</span>
        )}
      </Cell>
      <RowActions item={item} onOpen={onOpen} onEdit={onEdit} />
    </div>
  );
}
