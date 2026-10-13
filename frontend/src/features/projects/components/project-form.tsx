"use client";

import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

import { METHODOLOGY_LABELS, PROJECT_TYPE_LABELS, type ProjectDetail } from "../types";

const TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const METHODOLOGY_OPTIONS = Object.entries(METHODOLOGY_LABELS).map(([value, label]) => ({ value, label }));

const FIELD_MESSAGES = {
  name: "Escribe un nombre de entre 3 y 160 caracteres.",
  description: "La descripción admite hasta 5000 caracteres.",
  startDate: "Indica una fecha válida.",
  endDate: "La fecha de fin debe ser válida y posterior a la de inicio.",
};

type ProjectFormProps = {
  /** Sin proyecto: alta. Con proyecto: edicion de datos generales. */
  project?: ProjectDetail;
  onSaved: (project: ProjectDetail) => void;
  onCancel: () => void;
};

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const typeId = useId();
  const methodologyId = useId();
  const joinId = useId();
  const [joinAsLeader, setJoinAsLeader] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof FIELD_MESSAGES, string>>>({});
  const editing = project !== undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();

    setPending(true);
    setError(null);
    setFieldErrors({});

    try {
      const saved = editing
        ? await apiRequest<ProjectDetail>(`/projects/${project.id}`, {
            method: "PATCH",
            body: {
              name: text("name"),
              description: text("description") || null,
              type: text("type"),
              startDate: text("startDate") || null,
              endDate: text("endDate") || null,
            },
          })
        : await apiRequest<ProjectDetail>("/projects", {
            method: "POST",
            body: {
              name: text("name"),
              ...(text("description") ? { description: text("description") } : {}),
              type: text("type"),
              methodology: text("methodology"),
              ...(text("startDate") ? { startDate: text("startDate") } : {}),
              ...(text("endDate") ? { endDate: text("endDate") } : {}),
              joinAsLeader,
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
      <FormField label="Nombre" name="name" required minLength={3} maxLength={160} defaultValue={project?.name} error={fieldErrors.name} />
      <TextAreaField
        label="Descripción (opcional)"
        name="description"
        maxLength={5000}
        rows={3}
        defaultValue={project?.description ?? ""}
        error={fieldErrors.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={typeId} className="block text-sm font-medium text-hub-soft">
            Tipo
          </label>
          <OptionSelect id={typeId} name="type" options={TYPE_OPTIONS} defaultValue={project?.type ?? "research"} />
        </div>
        {!editing && (
          <div className="space-y-1.5">
            <label htmlFor={methodologyId} className="block text-sm font-medium text-hub-soft">
              Metodología
            </label>
            <OptionSelect id={methodologyId} name="methodology" options={METHODOLOGY_OPTIONS} defaultValue="traditional" />
          </div>
        )}
      </div>
      {!editing && (
        <p className="-mt-1 text-xs text-hub-muted">
          Tradicional: tareas y entregables sin sprints. Ágil: tareas en backlog que pueden organizarse en sprints.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Inicio (opcional)" name="startDate" type="date" defaultValue={project?.startDate ?? ""} error={fieldErrors.startDate} />
        <FormField label="Fin (opcional)" name="endDate" type="date" defaultValue={project?.endDate ?? ""} error={fieldErrors.endDate} />
      </div>
      {!editing && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-hub-border px-4 py-3">
          <div>
            <label htmlFor={joinId} className="text-sm font-medium text-hub-text">
              Participar como líder
            </label>
            <p className="mt-0.5 text-xs text-hub-muted">
              Desactívalo si solo administras el proyecto; tendrás que asignar un líder antes de activarlo.
            </p>
          </div>
          <Switch id={joinId} checked={joinAsLeader} onCheckedChange={setJoinAsLeader} />
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="min-h-10" pending={pending} pendingLabel="Guardando…">
          {editing ? "Guardar cambios" : "Crear proyecto"}
        </Button>
        <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
