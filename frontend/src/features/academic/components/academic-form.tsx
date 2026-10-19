"use client";

import { type FormEvent, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import type { ProjectDetail, ProjectSummary } from "@/features/projects/types";
import type { DocumentItem } from "@/features/documents/types";
import { apiRequest } from "@/lib/api/client";
import { allItems } from "@/lib/api/all-items";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";
import { PRODUCT_STATUSES, PRODUCT_TYPES, type AcademicItem, type AcademicKind } from "../types";

export type Person = { id: string; fullName: string };
export type Context = { people: Person[]; results: { id: string; title: string }[]; documents: { id: string; title: string }[] };
export type FormOptions = { projects: ProjectSummary[]; context: Context; institutional: boolean };

export async function formContext(projectId: string | null): Promise<Context> {
  if (projectId) {
    const [project, results, documents] = await Promise.all([
      apiRequest<ProjectDetail>(`/projects/${projectId}`),
      apiRequest<{ items: Context["results"] }>(`/projects/${projectId}/research-results`),
      allItems<DocumentItem>(`/projects/${projectId}/documents`),
    ]);
    return { people: project.members.filter(m => m.accountStatus === "active").map(m => ({ id: m.userId, fullName: m.fullName })), results: results.items, documents };
  }
  const [people, documents] = await Promise.all([allItems<Person>("/users?status=active"), allItems<DocumentItem>("/documents?scope=institutional")]);
  return { people, documents, results: [] };
}

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const FIELD_MESSAGES = { title: "Escribe un título de entre 3 y 200 caracteres.", description: "La descripción admite hasta 10000 caracteres.", doi: "Usa el formato 10.1234/identificador.", url: "Usa una dirección completa http o https.", source: "La fuente admite hasta 300 caracteres.", productDate: "Elige una fecha válida.", recognitionDate: "Elige una fecha válida.", authors: "Revisa las autorías: de 1 a 50, con integrante o nombre externo." };
type AuthorRow = { key: number; kind: "internal" | "external"; userId: string; externalName: string };

export function AcademicForm({ kind, item, initialProjectId, scoped, data, onSaved, onCancel }: {
  kind: AcademicKind; item?: AcademicItem; initialProjectId?: string; scoped?: boolean; data: FormOptions;
  onSaved: () => void; onCancel: () => void;
}) {
  const id = useId();
  const sequence = useRef(100);
  const contextRequest = useRef(0);
  const [projectId, setProjectId] = useState(item?.projectId ?? initialProjectId ?? "none");
  const [context, setContext] = useState(data.context);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<Record<keyof typeof FIELD_MESSAGES, string>>>({});
  const [authors, setAuthors] = useState<AuthorRow[]>(item?.authors?.map((a, index) => ({ key: index, kind: a.userId ? "internal" : "external", userId: a.userId ?? "none", externalName: a.externalName ?? "" })) ?? [{ key: 0, kind: "internal", userId: "none", externalName: "" }]);
  const [resultIds, setResultIds] = useState(item?.results?.map(r => r.id) ?? []);
  const recognition = kind === "recognitions";
  const originalScope = projectId === (item?.projectId ?? initialProjectId ?? "none");
  const retained = (item?.authors ?? []).filter(a => a.userId).map(a => ({ id: a.userId!, fullName: a.fullName }));
  if (item?.user) retained.push(item.user);
  const people = [...context.people, ...retained.filter(p => !context.people.some(c => c.id === p.id))];

  async function changeProject(value: string) {
    const request = ++contextRequest.current;
    setProjectId(value); setLoading(true); setError(null); setResultIds([]);
    try { const loaded = await formContext(value === "none" ? null : value); if (request === contextRequest.current) setContext(loaded); }
    catch (caught) { if (request === contextRequest.current) { setError(describeError(caught)); setContext({ people: [], results: [], documents: [] }); } }
    finally { if (request === contextRequest.current) setLoading(false); }
  }
  function updateAuthor(key: number, changes: Partial<AuthorRow>) { setAuthors(rows => rows.map(row => row.key === key ? { ...row, ...changes } : row)); }
  function move(index: number, delta: number) { setAuthors(rows => { const next = [...rows]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; }); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const optionalId = (key: string) => text(key) && text(key) !== "none" ? text(key) : null;
    if (!recognition && authors.some(a => a.kind === "internal" && a.userId === "none")) { setError("Elige un integrante para cada autoría interna."); return; }
    const body = { title: text("title"), description: text("description") || null, projectId: projectId === "none" ? null : projectId,
      ...(recognition ? { recognitionDate: text("recognitionDate"), userId: optionalId("userId"), evidenceDocumentId: optionalId("evidenceDocumentId") }
        : { type: text("type"), status: text("status"), productDate: text("productDate") || null, source: text("source") || null,
          doi: text("doi") || null, url: text("url") || null, resultIds,
          authors: authors.map(a => a.kind === "internal" ? { userId: a.userId } : { externalName: a.externalName.trim() }) }) };
    setPending(true); setError(null); setFields({});
    try { await apiRequest(`/${kind}${item ? `/${item.id}` : ""}`, { method: item ? "PUT" : "POST", body }); onSaved(); }
    catch (caught) { setError(describeError(caught)); setFields(fieldErrorMessages(caught, FIELD_MESSAGES)); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="space-y-5">
    {error && <Alert tone="error">{error}</Alert>}
    <fieldset disabled={pending} className="space-y-4">
      <FormField label="Título" name="title" required minLength={3} maxLength={200} defaultValue={item?.title} error={fields.title} />
      <TextAreaField label="Descripción" name="description" maxLength={10000} defaultValue={item?.description ?? ""} error={fields.description} />
      <div className="space-y-1.5"><label htmlFor={`${id}-project`} className="text-sm">Proyecto</label>
        <OptionSelect id={`${id}-project`} value={projectId} disabled={scoped || loading} onValueChange={value => void changeProject(value)} options={[
          ...(!scoped && data.institutional ? [{ value: "none", label: "Sin proyecto (institucional)" }] : []), ...data.projects.map(p => ({ value: p.id, label: p.name })),
        ]} />
      </div>
      {loading && <p role="status" className="text-sm text-hub-muted">Cargando opciones del proyecto…</p>}
      {recognition ? <>
        <FormField label="Fecha del reconocimiento" name="recognitionDate" type="date" required defaultValue={item?.recognitionDate} error={fields.recognitionDate} />
        <div className="space-y-1.5"><label htmlFor={`${id}-person`} className="text-sm">Integrante reconocido</label>
          <OptionSelect key={projectId} id={`${id}-person`} name="userId" defaultValue={item?.userId ?? "none"} options={[{ value: "none", label: "Solo el proyecto" }, ...people.map(p => ({ value: p.id, label: p.fullName }))]} />
        </div>
        <div className="space-y-1.5"><label htmlFor={`${id}-evidence`} className="text-sm">Evidencia documental</label>
          <OptionSelect key={projectId} id={`${id}-evidence`} name="evidenceDocumentId" defaultValue={originalScope ? item?.evidenceDocumentId ?? "none" : "none"} options={[{ value: "none", label: "Sin evidencia" }, ...context.documents.map(d => ({ value: d.id, label: d.title }))]} />
          <p className="text-xs text-hub-muted">Selecciona un archivo existente del mismo ámbito. Sus permisos de descarga se conservan.</p>
        </div>
      </> : <>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><label htmlFor={`${id}-type`} className="text-sm">Tipo de producto</label><OptionSelect id={`${id}-type`} name="type" defaultValue={item?.type ?? "article"} options={options(PRODUCT_TYPES)} /></div>
          <div className="space-y-1.5"><label htmlFor={`${id}-status`} className="text-sm">Estado</label><OptionSelect id={`${id}-status`} name="status" defaultValue={item?.status ?? "in_progress"} options={options(PRODUCT_STATUSES)} /></div>
        </div>
        <FormField label="Fecha de publicación o presentación" name="productDate" type="date" defaultValue={item?.productDate ?? ""} error={fields.productDate} />
        <FormField label="Revista, evento o fuente" name="source" maxLength={300} defaultValue={item?.source ?? ""} error={fields.source} />
        <FormField label="DOI (opcional)" name="doi" maxLength={200} hint="Formato: 10.1234/identificador" defaultValue={item?.doi ?? ""} error={fields.doi} />
        <FormField label="Enlace (opcional)" name="url" type="url" maxLength={2000} defaultValue={item?.url ?? ""} error={fields.url} />
        <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">Autorías, en orden de publicación</legend>
          {fields.authors && <p className="text-sm text-hub-field-error">{fields.authors}</p>}
          {authors.map((a, index) => <div key={a.key} className="space-y-3 rounded-xl border border-hub-border p-3">
            <label htmlFor={`${id}-kind-${a.key}`} className="text-sm">Autoría {index + 1}</label>
            <OptionSelect id={`${id}-kind-${a.key}`} value={a.kind} onValueChange={kind => updateAuthor(a.key, { kind: kind as AuthorRow["kind"] })} options={[{ value: "internal", label: "Integrante del semillero" }, { value: "external", label: "Autor externo (sin cuenta)" }]} />
            {a.kind === "internal" ? <OptionSelect id={`${id}-author-${a.key}`} aria-label={`Integrante de autoría ${index + 1}`} value={a.userId} onValueChange={userId => updateAuthor(a.key, { userId })} options={[{ value: "none", label: "Selecciona un integrante" }, ...people.map(p => ({ value: p.id, label: p.fullName }))]} />
              : <FormField label="Nombre del autor externo" required minLength={2} maxLength={160} value={a.externalName} onChange={event => updateAuthor(a.key, { externalName: event.target.value })} />}
            <div className="flex flex-wrap gap-2"><Button variant="neutral" disabled={index === 0} aria-label={`Subir autoría ${index + 1}`} onClick={() => move(index, -1)}>Subir</Button><Button variant="neutral" disabled={index === authors.length - 1} aria-label={`Bajar autoría ${index + 1}`} onClick={() => move(index, 1)}>Bajar</Button><Button variant="neutral" disabled={authors.length === 1} onClick={() => setAuthors(rows => rows.filter(row => row.key !== a.key))}>Quitar</Button></div>
          </div>)}
          <Button variant="neutral" disabled={authors.length >= 50} onClick={() => setAuthors(rows => [...rows, { key: ++sequence.current, kind: "internal", userId: "none", externalName: "" }])}>Agregar autoría</Button>
        </fieldset>
        {context.results.length > 0 && <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Resultados de investigación asociados</legend>{context.results.map(r => <label key={r.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={resultIds.includes(r.id)} onChange={event => setResultIds(ids => event.target.checked ? [...ids, r.id] : ids.filter(id => id !== r.id))} />{r.title}</label>)}</fieldset>}
      </>}
    </fieldset>
    <div className="flex flex-wrap justify-end gap-2"><Button variant="neutral" onClick={onCancel} disabled={pending}>Cancelar</Button><Button type="submit" pending={pending} disabled={loading} pendingLabel="Guardando…">Guardar</Button></div>
  </form>;
}
