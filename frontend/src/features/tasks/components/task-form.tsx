"use client";

import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

import { TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS, type TaskItem, type TaskStatus } from "../types";

const PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));
/** Valor del select para "sin responsable" (Radix no admite valores vacios). */
const NO_ASSIGNEE = "none";

const FIELD_MESSAGES = {
  title: "Escribe un título de entre 3 y 200 caracteres.",
  description: "La descripción admite hasta 5000 caracteres.",
  dueDate: "Indica una fecha válida.",
};

export type AssigneeOption = { userId: string; fullName: string };

type TaskFormProps = {
  projectId: string;
  /** Integrantes activos del proyecto: los unicos que pueden ser responsables (F2-08). */
  assignees: AssigneeOption[];
  /** Sin tarea: alta (en la columna indicada). Con tarea: edicion completa. */
  task?: TaskItem;
  initialStatus?: TaskStatus;
  onSaved: (task: TaskItem) => void;
  onCancel: () => void;
};

export function TaskForm({ projectId, assignees, task, initialStatus = "todo", onSaved, onCancel }: TaskFormProps) {
  const priorityId = useId();
  const assigneeId = useId();
  const statusId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof FIELD_MESSAGES, string>>>({});
  const editing = task !== undefined;

  // Una persona retirada del proyecto puede seguir como responsable de tareas hechas.
  const options = [
    { value: NO_ASSIGNEE, label: "Sin responsable" },
    ...assignees.map((member) => ({ value: member.userId, label: member.fullName })),
    ...(task?.assignee && !assignees.some((member) => member.userId === task.assignee?.userId)
      ? [{ value: task.assignee.userId, label: `${task.assignee.fullName} (fuera del proyecto)` }]
      : []),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const assignee = text("assigneeId");
    const body = {
      title: text("title"),
      description: text("description") || null,
      priority: text("priority"),
      status: text("status"),
      assigneeId: assignee && assignee !== NO_ASSIGNEE ? assignee : null,
      dueDate: text("dueDate") || null,
    };

    setPending(true);
    setError(null);
    setFieldErrors({});

    try {
      const saved = editing
        ? await apiRequest<TaskItem>(`/projects/${projectId}/tasks/${task.id}`, {
            method: "PATCH",
            // Solo se envian los cambios: asi un responsable fuera del proyecto no se reenvia.
            body: Object.fromEntries(
              Object.entries(body).filter(([key, value]) => {
                const current = key === "assigneeId" ? (task.assignee?.userId ?? null) : task[key as keyof TaskItem];
                return value !== current;
              }),
            ),
          })
        : await apiRequest<TaskItem>(`/projects/${projectId}/tasks`, {
            method: "POST",
            body: Object.fromEntries(Object.entries(body).filter(([, value]) => value !== null)),
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
      <FormField label="Título" name="title" required minLength={3} maxLength={200} defaultValue={task?.title} error={fieldErrors.title} />
      <TextAreaField
        label="Descripción (opcional)"
        name="description"
        maxLength={5000}
        rows={3}
        defaultValue={task?.description ?? ""}
        error={fieldErrors.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={assigneeId} className="block text-sm font-medium text-hub-soft">
            Responsable
          </label>
          <OptionSelect id={assigneeId} name="assigneeId" options={options} defaultValue={task?.assignee?.userId ?? NO_ASSIGNEE} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={priorityId} className="block text-sm font-medium text-hub-soft">
            Prioridad
          </label>
          <OptionSelect id={priorityId} name="priority" options={PRIORITY_OPTIONS} defaultValue={task?.priority ?? "medium"} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={statusId} className="block text-sm font-medium text-hub-soft">
            Estado
          </label>
          <OptionSelect id={statusId} name="status" options={STATUS_OPTIONS} defaultValue={task?.status ?? initialStatus} />
        </div>
        <FormField label="Fecha límite (opcional)" name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} error={fieldErrors.dueDate} />
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="min-h-10" pending={pending} pendingLabel="Guardando…">
          {editing ? "Guardar cambios" : "Crear tarea"}
        </Button>
        <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
