"use client";

import { type FormEvent, useEffect, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

import { LINE_STATUS_LABELS, type ResearchLine } from "../types";

const FIELD_MESSAGES = {
  name: "Escribe un nombre de entre 3 y 160 caracteres que no use otra línea.",
  description: "La descripción admite hasta 5000 caracteres.",
  objectives: "Los objetivos admiten hasta 5000 caracteres.",
  responsibleUserId: "Elige un integrante activo.",
};

/** Valor del selector para "sin responsable" (Radix no admite valores vacios). */
const NONE = "none";

const STATUS_OPTIONS = Object.entries(LINE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

type LineFormProps = {
  /** Sin linea: alta. Con linea: edicion. */
  line?: ResearchLine;
  onSaved: (line: ResearchLine) => void;
  onCancel: () => void;
};

export function LineForm({ line, onSaved, onCancel }: LineFormProps) {
  const responsibleId = useId();
  const statusId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof FIELD_MESSAGES, string>>>({});
  const [people, setPeople] = useState<{ id: string; fullName: string }[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiRequest<{ items: { id: string; fullName: string }[] }>("/users?status=active&pageSize=100")
      .then((response) => {
        if (!cancelled) setPeople(response.items);
      })
      .catch(() => {
        // Sin la lista se conserva el responsable actual; el resto del formulario sigue funcionando.
        if (!cancelled) setPeople([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const responsibleOptions = [
    { value: NONE, label: "Sin responsable" },
    ...(line?.responsible && !people?.some((person) => person.id === line.responsible?.userId)
      ? [{ value: line.responsible.userId, label: line.responsible.fullName }]
      : []),
    ...(people ?? []).map((person) => ({ value: person.id, label: person.fullName })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const responsible = text("responsibleUserId");

    setPending(true);
    setError(null);
    setFieldErrors({});

    try {
      const saved = line
        ? await apiRequest<ResearchLine>(`/research-lines/${line.id}`, {
            method: "PATCH",
            body: {
              name: text("name"),
              description: text("description") || null,
              objectives: text("objectives") || null,
              responsibleUserId: responsible && responsible !== NONE ? responsible : null,
              status: text("status"),
            },
          })
        : await apiRequest<ResearchLine>("/research-lines", {
            method: "POST",
            body: {
              name: text("name"),
              ...(text("description") ? { description: text("description") } : {}),
              ...(text("objectives") ? { objectives: text("objectives") } : {}),
              ...(responsible && responsible !== NONE ? { responsibleUserId: responsible } : {}),
            },
          });
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
      <FormField label="Nombre" name="name" required minLength={3} maxLength={160} defaultValue={line?.name} error={fieldErrors.name} />
      <TextAreaField
        label="Descripción (opcional)"
        name="description"
        maxLength={5000}
        rows={3}
        defaultValue={line?.description ?? ""}
        error={fieldErrors.description}
      />
      <TextAreaField
        label="Objetivos (opcional)"
        name="objectives"
        maxLength={5000}
        rows={3}
        defaultValue={line?.objectives ?? ""}
        error={fieldErrors.objectives}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={responsibleId} className="block text-xs font-semibold text-hub-text">
            Responsable (opcional)
          </label>
          <OptionSelect
            id={responsibleId}
            name="responsibleUserId"
            options={responsibleOptions}
            defaultValue={line?.responsible?.userId ?? NONE}
            // Se vuelve a montar al llegar la lista para que el valor inicial tenga su opcion.
            key={people === null ? "loading" : "ready"}
          />
          {fieldErrors.responsibleUserId && <p className="text-xs font-medium text-hub-field-error">{fieldErrors.responsibleUserId}</p>}
        </div>
        {line && (
          <div className="space-y-1.5">
            <label htmlFor={statusId} className="block text-xs font-semibold text-hub-text">
              Estado
            </label>
            <OptionSelect id={statusId} name="status" options={STATUS_OPTIONS} defaultValue={line.status} />
          </div>
        )}
      </div>
      {line && (
        <p className="-mt-1 text-xs text-hub-muted">Una línea inactiva se conserva en los proyectos que ya la tienen, pero no se puede asociar a otros.</p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="min-h-10" pending={pending} pendingLabel="Guardando…">
          {line ? "Guardar cambios" : "Crear línea"}
        </Button>
        <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
