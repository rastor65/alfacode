"use client";

import { type FormEvent, useEffect, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import type { PersonRef } from "@/features/research/types";
import { apiRequest, apiUpload } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

import {
  ACCESS_LABELS,
  type AccessLevel,
  CATEGORY_LABELS,
  type DocumentItem,
  type DocumentScope,
  type UploadLimits,
  acceptAttribute,
  accessHint,
  checkFile,
  formatBytes,
} from "../types";

const FIELD_MESSAGES = {
  file: "Adjunta un archivo.",
  title: "El título debe tener entre 3 y 200 caracteres.",
  description: "La descripción admite hasta 5000 caracteres.",
  grantedUserIds: "Las personas autorizadas deben ser integrantes activos.",
  researchResultId: "Elige un resultado de este proyecto.",
};

/** Valor del selector para "sin resultado" (Radix no admite valores vacios). */
const NONE = "none";

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const ACCESS_OPTIONS = Object.entries(ACCESS_LABELS).map(([value, label]) => ({ value, label }));

type DocumentFormProps = {
  scope: DocumentScope;
  /** Carga en un proyecto (con `scope: project`). */
  projectId?: string;
  /** Resultados del proyecto a los que se puede vincular. */
  results?: { id: string; title: string }[];
  limits: UploadLimits;
  /** Sin documento: carga. Con documento: edicion de metadatos y permisos. */
  document?: DocumentItem;
  /** Resultado elegido de antemano (al subir desde un resultado). */
  defaultResultId?: string;
  onSaved: (document: DocumentItem) => void;
  onCancel: () => void;
};

export function DocumentForm({ scope, projectId, results = [], limits, document, defaultResultId, onSaved, onCancel }: DocumentFormProps) {
  const categoryId = useId();
  const accessId = useId();
  const resultId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof FIELD_MESSAGES, string>>>({});
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(document?.accessLevel ?? (scope === "institutional" ? "general" : "restricted"));
  const [people, setPeople] = useState<PersonRef[] | null>(null);
  const editing = Boolean(document);
  const showResults = scope === "project" && results.length > 0;

  // Las personas que se pueden autorizar se piden solo cuando el documento es privado.
  useEffect(() => {
    if (accessLevel !== "private" || people !== null) {
      return;
    }

    let cancelled = false;
    apiRequest<{ items: { id: string; fullName: string }[] }>("/users?status=active&pageSize=100")
      .then((response) => {
        if (!cancelled) setPeople(response.items.map((user) => ({ userId: user.id, fullName: user.fullName })));
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      });

    return () => {
      cancelled = true;
    };
  }, [accessLevel, people]);

  const granted = new Set(document?.grantedUsers?.map((person) => person.userId));
  const grantOptions = [
    ...(document?.grantedUsers ?? []).filter((person) => !people?.some((candidate) => candidate.userId === person.userId)),
    ...(people ?? []).filter((person) => person.userId !== document?.uploadedBy?.userId),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const grantedUserIds = accessLevel === "private" ? form.getAll("grantedUserIds").map(String) : [];
    const result = text("researchResultId");

    setError(null);
    setFieldErrors({});

    if (!editing) {
      const file = form.get("file");

      if (!(file instanceof File) || !file.name) {
        setFileError(FIELD_MESSAGES.file);
        return;
      }

      const problem = checkFile(file, limits);

      if (problem) {
        setFileError(problem);
        return;
      }
    }

    setPending(true);

    try {
      let saved: DocumentItem;

      if (document) {
        saved = await apiRequest<DocumentItem>(`/documents/${document.id}`, {
          method: "PATCH",
          body: {
            title: text("title"),
            description: text("description") || null,
            category: text("category"),
            accessLevel,
            // Solo si el selector se mostro: desde el repositorio general no se toca el vinculo.
            ...(showResults ? { researchResultId: result && result !== NONE ? result : null } : {}),
            ...(accessLevel === "private" ? { grantedUserIds } : {}),
          },
        });
      } else {
        const upload = new FormData();
        upload.append("file", form.get("file") as File);
        if (text("title")) upload.append("title", text("title"));
        if (text("description")) upload.append("description", text("description"));
        upload.append("category", text("category"));
        upload.append("accessLevel", accessLevel);
        if (result && result !== NONE) upload.append("researchResultId", result);
        if (grantedUserIds.length > 0) upload.append("grantedUserIds", grantedUserIds.join(","));
        saved = await apiUpload<DocumentItem>(scope === "project" ? `/projects/${projectId}/documents` : "/documents", upload);
      }

      onSaved(saved);
    } catch (caught) {
      setFieldErrors(fieldErrorMessages(caught, FIELD_MESSAGES));
      setError(describeError(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {!editing && (
        <div className="space-y-1.5">
          <FormField
            label="Archivo"
            name="file"
            type="file"
            required
            accept={acceptAttribute(limits.extensions)}
            className="[&_input]:h-auto [&_input]:py-2"
            hint={`${limits.extensions.map((item) => item.toUpperCase()).join(", ")}. Máximo ${formatBytes(limits.maxBytes)}.`}
            error={fileError ?? fieldErrors.file}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              setFileError(file ? checkFile(file, limits) : null);
            }}
          />
        </div>
      )}
      <FormField
        label={editing ? "Título" : "Título (opcional)"}
        name="title"
        required={editing}
        minLength={3}
        maxLength={200}
        defaultValue={document?.title}
        hint={editing ? undefined : "Si lo dejas vacío se usa el nombre del archivo."}
        error={fieldErrors.title}
      />
      <TextAreaField
        label="Descripción (opcional)"
        name="description"
        maxLength={5000}
        rows={2}
        defaultValue={document?.description ?? ""}
        error={fieldErrors.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={categoryId} className="block text-xs font-semibold text-hub-text">
            Tipo
          </label>
          <OptionSelect id={categoryId} name="category" options={CATEGORY_OPTIONS} defaultValue={document?.category ?? "other"} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={accessId} className="block text-xs font-semibold text-hub-text">
            Acceso
          </label>
          <OptionSelect id={accessId} options={ACCESS_OPTIONS} value={accessLevel} onValueChange={(value) => setAccessLevel(value as AccessLevel)} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-hub-muted">{accessHint(accessLevel, scope)}</p>

      {showResults && (
        <div className="space-y-1.5">
          <label htmlFor={resultId} className="block text-xs font-semibold text-hub-text">
            Resultado vinculado (opcional)
          </label>
          <OptionSelect
            id={resultId}
            name="researchResultId"
            options={[{ value: NONE, label: "Sin resultado" }, ...results.map((item) => ({ value: item.id, label: item.title }))]}
            defaultValue={document?.researchResult?.id ?? defaultResultId ?? NONE}
          />
        </div>
      )}

      {accessLevel === "private" && (
        <fieldset>
          <legend className="text-xs font-semibold text-hub-text">Personas autorizadas</legend>
          {people === null ? (
            <p className="mt-1.5 text-sm text-hub-muted" role="status">
              Cargando integrantes…
            </p>
          ) : grantOptions.length === 0 ? (
            <p className="mt-1.5 text-sm text-hub-muted">No hay otros integrantes activos.</p>
          ) : (
            <div className="mt-1.5 grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
              {grantOptions.map((person) => (
                <label key={person.userId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-hub-text hover:bg-hub-hover">
                  <input
                    type="checkbox"
                    name="grantedUserIds"
                    value={person.userId}
                    defaultChecked={granted.has(person.userId)}
                    className="size-4 accent-cyan-600"
                  />
                  {person.fullName}
                </label>
              ))}
            </div>
          )}
          {fieldErrors.grantedUserIds && <p className="mt-1 text-xs font-medium text-hub-field-error">{fieldErrors.grantedUserIds}</p>}
        </fieldset>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="min-h-10" pending={pending} pendingLabel={editing ? "Guardando…" : "Subiendo…"}>
          {editing ? "Guardar cambios" : "Subir documento"}
        </Button>
        <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
