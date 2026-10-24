import { CalendarDays, Timer } from "lucide-react";

import { OptionSelect } from "@/components/ui/option-select";
import { formatCalendarDate } from "@/features/projects/types";
import { dangerChip, neutralChip } from "@/features/tracking/components/dashboard-ui";
import { overdueLabel } from "@/features/tracking/types";
import { formatShortDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import { TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS, type TaskItem, type TaskStatus, isOverdue, isTaskStatus } from "../types";
import { PRIORITY_STYLE, initials } from "./task-ui";

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));
export const DRAG_TYPE = "application/x-alfacode-task";

export function PriorityChip({ priority }: { priority: TaskItem["priority"] }) {
  const { icon: Icon, className } = PRIORITY_STYLE[priority];
  return <span className={cn(className, "gap-1")}><Icon aria-hidden="true" className="size-3" />{TASK_PRIORITY_LABELS[priority]}<span className="sr-only"> prioridad</span></span>;
}

export function Assignee({ task, className }: { task: Pick<TaskItem, "assignee">; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5 text-[11px] text-hub-muted", className)}>
      <span
        aria-hidden="true"
        className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", task.assignee ? "bg-hub-accent-soft text-hub-accent" : "border border-dashed border-hub-border")}
      >
        {task.assignee ? initials(task.assignee.fullName) : "?"}
      </span>
      <span className="truncate">{task.assignee?.fullName ?? "Sin responsable"}</span>
    </span>
  );
}

type TaskCardProps = {
  task: TaskItem;
  today: string;
  /** Nombre del sprint, cuando el tablero muestra todas las tareas. */
  sprintName?: string;
  busy: boolean;
  disabled: boolean;
  onOpen: () => void;
  onMove: (status: TaskStatus) => void;
};

/** Tarjeta del tablero: arrastrable si la persona puede cambiar el estado; el selector es la alternativa accesible. */
export function TaskCard({ task, today, sprintName, busy, disabled, onOpen, onMove }: TaskCardProps) {
  const overdue = isOverdue(task, today), done = task.status === "done";

  return (
    <li
      draggable={task.permissions.canChangeStatus && !disabled}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      aria-busy={busy}
      className={cn(
        "group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-hub-border bg-hub-panel p-3 shadow-sm transition-shadow hover:shadow-md",
        task.permissions.canChangeStatus && "cursor-grab active:cursor-grabbing",
        busy && "opacity-60",
        done && "opacity-90",
      )}
    >
      {overdue && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-hub-field-error" />}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <PriorityChip priority={task.priority} />
        {overdue && <span className={dangerChip}>Vencida</span>}
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className={cn(
          "w-full break-words text-left text-sm font-semibold leading-snug text-hub-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
          done && "line-through decoration-hub-muted",
        )}
      >
        {task.title}
      </button>
      {sprintName && (
        <span className={cn(neutralChip, "gap-1 self-start")}><Timer aria-hidden="true" className="size-3" />{sprintName}</span>
      )}
      <div className="flex items-center justify-between gap-2">
        <Assignee task={task} />
        {task.dueDate && (
          <span className={cn("flex shrink-0 items-center gap-1 text-[11px]", overdue ? "font-semibold text-hub-field-error" : "text-hub-muted")} title={formatCalendarDate(task.dueDate) ?? undefined}>
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {overdue ? `Venció ${overdueLabel(task.dueDate, today).toLowerCase()}` : formatShortDay(task.dueDate)}
          </span>
        )}
      </div>
      {task.permissions.canChangeStatus && (
        <OptionSelect
          id={`mover-${task.id}`}
          aria-label={`Estado de «${task.title}»`}
          options={STATUS_OPTIONS}
          value={task.status}
          disabled={disabled}
          className="h-8 text-xs"
          onValueChange={(value) => isTaskStatus(value) && onMove(value)}
        />
      )}
    </li>
  );
}

