"use client";

import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

import type { SprintDetail } from "../types";

const FIELD_MESSAGES = {
  name: "Escribe un nombre de entre 3 y 120 caracteres.",
  goal: "El objetivo admite hasta 2000 caracteres.",
  startDate: "Indica una fecha válida.",
  endDate: "La fecha de fin debe ser válida e igual o posterior a la de inicio.",
};

type SprintFormProps = {
  projectId: string;
  /** Sin sprint: alta. Con sprint (planificado): edicion. */
  sprint?: SprintDetail;
  onSaved: (sprint: SprintDetail) => void;
  onCancel: () => void;
};

export function SprintForm({ projectId, sprint, onSaved, onCancel }: SprintFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof FIELD_MESSAGES, string>>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();

    setPending(true);
    setError(null);
    setFieldErrors({});

    try {
      const saved = sprint
        ? await apiRequest<SprintDetail>(`/projects/${projectId}/sprints/${sprint.id}`, {
            method: "PATCH",
            body: { name: text("name"), goal: text("goal") || null, startDate: text("startDate"), endDate: text("endDate") },
          })
        : await apiRequest<SprintDetail>(`/projects/${projectId}/sprints`, {
            method: "POST",
            body: {
              name: text("name"),
              ...(text("goal") ? { goal: text("goal") } : {}),
              startDate: text("startDate"),
              endDate: text("endDate"),
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
      <FormField label="Nombre" name="name" required minLength={3} maxLength={120} defaultValue={sprint?.name} error={fieldErrors.name} />
      <TextAreaField
        label="Objetivo (opcional)"
        name="goal"
        maxLength={2000}
        rows={2}
        defaultValue={sprint?.goal ?? ""}
        error={fieldErrors.goal}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Inicio" name="startDate" type="date" required defaultValue={sprint?.startDate} error={fieldErrors.startDate} />
        <FormField label="Fin" name="endDate" type="date" required defaultValue={sprint?.endDate} error={fieldErrors.endDate} />
      </div>
      <p className="-mt-1 text-xs text-hub-muted">Se recomienda una duración de una a cuatro semanas.</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="min-h-10" pending={pending} pendingLabel="Guardando…">
          {sprint ? "Guardar cambios" : "Crear sprint"}
        </Button>
        <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
