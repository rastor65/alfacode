"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { ProjectSummary } from "@/features/projects/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { PRODUCT_STATUSES, PRODUCT_TYPES, safeExternalUrl, type AcademicItem, type AcademicKind } from "../types";
import { AcademicForm, formContext, type FormOptions } from "./academic-form";
import { allItems } from "@/lib/api/all-items";

export function AcademicCatalog({ kind, items, canCreate, canCreateInstitutional, projectId }: { kind: AcademicKind; items: AcademicItem[]; canCreate: boolean; canCreateInstitutional: boolean; projectId?: string }) {
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

  function close() { ++request.current; setMode(null); setSelected(undefined); setError(null); setConfirm(false); }
  async function open(item: AcademicItem) {
    const current = ++request.current;
    setMode("detail"); setSelected(undefined); setError(null); setConfirm(false); setLoading(true);
    try { const fresh = await apiRequest<AcademicItem>(`/${kind}/${item.id}`); if (current === request.current) setSelected(fresh); }
    catch (caught) { if (current === request.current) setError(describeError(caught)); }
    finally { if (current === request.current) setLoading(false); }
  }
  async function form(item?: AcademicItem) {
    const current = ++request.current;
    setMode("form"); setSelected(item); setData(null); setError(null); setLoading(true);
    try {
      const [projects, context] = await Promise.all([allItems<ProjectSummary>("/projects"), formContext(item?.projectId ?? projectId ?? null)]);
      if (current === request.current) setData({ projects: projects.filter(p => !["completed", "cancelled"].includes(p.status) && (canCreateInstitutional || p.myRole === "leader")), context, institutional: canCreateInstitutional });
    } catch (caught) { if (current === request.current) setError(describeError(caught)); }
    finally { if (current === request.current) setLoading(false); }
  }
  async function remove() {
    if (!selected) return;
    setDeleting(true); setError(null);
    try { await apiRequest(`/${kind}/${selected.id}`, { method: "DELETE" }); close(); router.refresh(); }
    catch (caught) { setError(describeError(caught)); }
    finally { setDeleting(false); }
  }
  const external = safeExternalUrl(selected?.url);
  return <>
    {canCreate && <Button variant="neutral" onClick={() => void form()} aria-haspopup="dialog">{recognition ? "Nuevo reconocimiento" : "Nuevo producto"}</Button>}
    {items.length ? <ul className="mt-4 divide-y divide-hub-border rounded-xl border border-hub-border">{items.map(item => <li key={item.id}>
      <button type="button" onClick={() => void open(item)} aria-haspopup="dialog" className="flex min-h-16 w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
        <span className="min-w-0 flex-1"><span className="block break-words font-medium text-hub-text">{item.title}</span><span className="mt-1 block break-words text-sm text-hub-muted">{recognition ? item.user?.fullName ?? item.project?.name : item.authors?.map(a => a.fullName).join(", ")}</span></span>
        {item.status && <Badge>{PRODUCT_STATUSES[item.status]}</Badge>}
      </button>
    </li>)}</ul> : <p className="mt-4 rounded-xl border border-dashed border-hub-border px-4 py-8 text-center text-sm text-hub-muted">No hay {recognition ? "reconocimientos" : "productos"} para los filtros y permisos actuales.</p>}
    <Modal open={mode !== null} onClose={close} size="lg" title={mode === "form" ? `${selected ? "Editar" : "Nuevo"} ${recognition ? "reconocimiento" : "producto"}` : selected?.title ?? "Detalle"}>
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}
      {loading ? <p role="status" className="text-sm text-hub-muted">Cargando…</p> : mode === "form" && data ? <AcademicForm kind={kind} item={selected} initialProjectId={projectId} scoped={Boolean(projectId)} data={data} onCancel={close} onSaved={() => { close(); router.refresh(); }} /> : selected && mode === "detail" ? <div className="space-y-5">
        <dl className="space-y-3 text-sm">
          {selected.type && <div><dt className="text-hub-muted">Tipo</dt><dd>{PRODUCT_TYPES[selected.type]}</dd></div>}
          {selected.status && <div><dt className="text-hub-muted">Estado</dt><dd>{PRODUCT_STATUSES[selected.status]}</dd></div>}
          <div><dt className="text-hub-muted">Fecha</dt><dd>{selected.recognitionDate ?? selected.productDate ?? "Sin fecha"}</dd></div>
          {selected.description && <div><dt className="text-hub-muted">Descripción</dt><dd className="whitespace-pre-wrap break-words">{selected.description}</dd></div>}
          {selected.project && <div><dt className="text-hub-muted">Proyecto</dt><dd><Link className="text-hub-accent underline" href={`/hub/proyectos/${selected.project.id}/produccion`}>{selected.project.name}</Link></dd></div>}
          {selected.user && <div><dt className="text-hub-muted">Integrante reconocido</dt><dd>{selected.user.fullName}</dd></div>}
          {selected.source && <div><dt className="text-hub-muted">Fuente</dt><dd className="break-words">{selected.source}</dd></div>}
          {selected.doi && <div><dt className="text-hub-muted">DOI</dt><dd className="break-all">{selected.doi}</dd></div>}
          {external && <div><dt className="text-hub-muted">Enlace</dt><dd><a href={external} target="_blank" rel="noopener noreferrer" className="break-all text-hub-accent underline">Abrir fuente (nueva pestaña)</a></dd></div>}
        </dl>
        {selected.authors && <section><h3 className="text-sm font-semibold">Autorías</h3><ol className="mt-2 list-inside list-decimal space-y-2 text-sm">{selected.authors.map(a => <li key={a.position}>{a.fullName}{!a.userId && " (externo)"}</li>)}</ol></section>}
        {selected.results && selected.results.length > 0 && <section><h3 className="text-sm font-semibold">Resultados asociados</h3><ul className="mt-2 space-y-2 text-sm">{selected.results.map(r => <li key={r.id}>{r.title}</li>)}</ul></section>}
        {selected.evidence && <a href={`/api/v1/documents/${selected.evidence.id}/download`} className="inline-flex min-h-11 items-center text-sm text-hub-accent underline">Descargar evidencia: {selected.evidence.title}</a>}
        {selected.permissions.canManage && <div className="border-t border-hub-border pt-4">
          {confirm ? <div className="space-y-3"><p className="text-sm">¿Eliminar este registro y sus asociaciones? Esta acción no elimina archivos documentales ni cuentas.</p><div className="flex gap-2"><Button pending={deleting} onClick={() => void remove()}>Eliminar registro</Button><Button variant="neutral" disabled={deleting} onClick={() => setConfirm(false)}>Conservar</Button></div></div>
            : <div className="flex flex-wrap gap-2"><Button variant="neutral" onClick={() => void form(selected)}>Editar</Button><Button variant="neutral" onClick={() => setConfirm(true)}>Eliminar</Button></div>}
        </div>}
      </div> : null}
    </Modal>
  </>;
}
