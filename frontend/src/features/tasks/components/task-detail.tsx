import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { formatCalendarDate } from "@/features/projects/types";
import { dangerChip, eyebrow, neutralChip } from "@/features/tracking/components/dashboard-ui";
import { cn } from "@/lib/utils";

import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskItem, type TaskStatus, isOverdue, isTaskStatus } from "../types";
import { PriorityChip } from "./task-card";
import { STATUS_CHIP } from "./task-ui";

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));

type TaskDetailProps = {
  task: TaskItem;
  today: string;
  sprintName?: string;
  disabled: boolean;
  onEdit: () => void;
  onMove: (status: TaskStatus) => void;
};

/** Contenido del dialogo de una tarea: datos, estado (si solo puede cambiarlo) y edicion (si puede editarla). */
export function TaskDetail({ task, today, sprintName, disabled, onEdit, onMove }: TaskDetailProps) {
  const overdue = isOverdue(task, today);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={STATUS_CHIP[task.status]}>{TASK_STATUS_LABELS[task.status]}</span>
        <PriorityChip priority={task.priority} />
        {overdue && <span className={dangerChip}>Vencida</span>}
        {sprintName && <span className={neutralChip}>{sprintName}</span>}
      </div>

      {task.description ? (
        <p className="whitespace-pre-line break-words text-sm text-hub-soft">{task.description}</p>
      ) : (
        <p className="text-sm text-hub-muted">Sin descripción.</p>
      )}

      <dl className="grid gap-4 rounded-lg bg-hub-subtle p-4 sm:grid-cols-2">
        <Field label="Responsable" value={task.assignee?.fullName ?? "Sin responsable"} />
        <Field label="Fecha límite" value={formatCalendarDate(task.dueDate) ?? "Sin definir"} danger={overdue} />
        <Field label="Creada por" value={task.createdBy?.fullName ?? "No disponible"} />
        <Field label="Sprint" value={sprintName ?? "Backlog (sin sprint)"} />
      </dl>

      {task.permissions.canChangeStatus && !task.permissions.canEdit && (
        <div className="space-y-1.5">
          <label htmlFor={`detalle-estado-${task.id}`} className="block text-sm font-medium text-hub-soft">
            Estado
          </label>
          <OptionSelect
            id={`detalle-estado-${task.id}`}
            options={STATUS_OPTIONS}
            value={task.status}
            disabled={disabled}
            onValueChange={(value) => isTaskStatus(value) && onMove(value)}
          />
        </div>
      )}

      {task.permissions.canEdit && (
        <Button variant="neutral" className="min-h-10" onClick={onEdit}>
          <Pencil size={15} className="mr-2" aria-hidden="true" />
          Editar tarea
        </Button>
      )}
    </div>
  );
}

function Field({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className={eyebrow}>{label}</dt>
      <dd className={cn("mt-1 break-words text-sm", danger ? "font-semibold text-hub-field-error" : "text-hub-text")}>{value}</dd>
    </div>
  );
}
