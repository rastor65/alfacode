"use client";

import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

import { type PersonRef, RESULT_TYPE_LABELS, type ResearchResult, participantOptions } from "../types";

const FIELD_MESSAGES = {
  title: "Escribe un título de entre 3 y 200 caracteres.",
  description: "La descripción admite hasta 10000 caracteres.",
  resultDate: "Indica una fecha válida.",
  references: "Las referencias admiten hasta 5000 caracteres.",
  participantIds: "Los participantes deben ser integrantes del proyecto.",
};

const TYPE_OPTIONS = Object.entries(RESULT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

type ResultFormProps = {
  projectId: string;
  /** Equipo actual del proyecto (candidatos a participantes). */
  team: PersonRef[];
  /** Sin resultado: alta. Con resultado: edicion. */
  result?: ResearchResult;
  onSaved: (result: ResearchResult) => void;
  onCancel: () => void;
};

export function ResultForm({ projectId, team, result, onSaved, onCancel }: ResultFormProps) {
  const typeId = useId();
  const participantsId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof FIELD_MESSAGES, string>>>({});
  const options = participantOptions(team, result?.participants);
  const selected = new Set(result?.participants.map((person) => person.userId));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const participantIds = form.getAll("participantIds").map(String);

    setPending(true);
    setError(null);
    setFieldErrors({});

    try {
      const saved = result
        ? await apiRequest<ResearchResult>(`/projects/${projectId}/research-results/${result.id}`, {
            method: "PATCH",
            body: {
              title: text("title"),
              description: text("description") || null,
              type: text("type"),
              resultDate: text("resultDate") || null,
              references: text("references") || null,
              participantIds,
            },
          })
        : await apiRequest<ResearchResult>(`/projects/${projectId}/research-results`, {
            method: "POST",
            body: {
              title: text("title"),
              type: text("type"),
              ...(text("description") ? { description: text("description") } : {}),
              ...(text("resultDate") ? { resultDate: text("resultDate") } : {}),
              ...(text("references") ? { references: text("references") } : {}),
              participantIds,
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
      <FormField label="Título" name="title" required minLength={3} maxLength={200} defaultValue={result?.title} error={fieldErrors.title} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={typeId} className="block text-xs font-semibold text-hub-text">
            Tipo
          </label>
          <OptionSelect id={typeId} name="type" options={TYPE_OPTIONS} defaultValue={result?.type ?? "finding"} />
        </div>
        <FormField
          label="Fecha (opcional)"
          name="resultDate"
          type="date"
          defaultValue={result?.resultDate ?? ""}
          error={fieldErrors.resultDate}
        />
      </div>
      <TextAreaField
        label="Descripción (opcional)"
        name="description"
        maxLength={10000}
        rows={4}
        defaultValue={result?.description ?? ""}
        error={fieldErrors.description}
      />
      <TextAreaField
        label="Referencias documentales (opcional)"
        name="references"
        maxLength={5000}
        rows={2}
        hint="Informes, enlaces o documentos de respaldo. Los archivos se podrán adjuntar con el módulo de documentos."
        defaultValue={result?.references ?? ""}
        error={fieldErrors.references}
      />
      <fieldset aria-describedby={fieldErrors.participantIds ? `${participantsId}-error` : undefined}>
        <legend className="text-xs font-semibold text-hub-text">Participantes</legend>
        {options.length === 0 ? (
          <p className="mt-1.5 text-sm text-hub-muted">El proyecto aún no tiene integrantes.</p>
        ) : (
          <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
            {options.map((person) => (
              <label key={person.userId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-hub-text hover:bg-hub-hover">
                <input
                  type="checkbox"
                  name="participantIds"
                  value={person.userId}
                  defaultChecked={selected.has(person.userId)}
                  className="size-4 accent-cyan-600"
                />
                {person.fullName}
              </label>
            ))}
          </div>
        )}
        {fieldErrors.participantIds && (
          <p id={`${participantsId}-error`} className="mt-1 text-xs font-medium text-hub-field-error">
            {fieldErrors.participantIds}
          </p>
        )}
      </fieldset>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="min-h-10" pending={pending} pendingLabel="Guardando…">
          {result ? "Guardar cambios" : "Registrar resultado"}
        </Button>
        <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
