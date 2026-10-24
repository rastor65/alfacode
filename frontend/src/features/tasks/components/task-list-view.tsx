import { CalendarDays } from "lucide-react";

import { OptionSelect } from "@/components/ui/option-select";
import { formatCalendarDate } from "@/features/projects/types";
import { dangerChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { overdueLabel } from "@/features/tracking/types";
import { formatShortDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskItem, type TaskStatus, isOverdue, isTaskStatus } from "../types";
import { Assignee, PriorityChip } from "./task-card";
import { STATUS_CHIP } from "./task-ui";

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));

type TaskListViewProps = {
  tasks: TaskItem[];
  today: string;
  sprintNames: Map<string, string>;
  /** Mostrar la columna de sprint (cuando se ven todas las tareas). */
  showSprint: boolean;
  moving: string | null;
  onOpen: (task: TaskItem) => void;
  onMove: (task: TaskItem, status: TaskStatus) => void;
};

/** Vista de lista del mismo conjunto de tareas: ideal para revisar y ordenar el backlog. */
export function TaskListView({ tasks, today, sprintNames, showSprint, moving, onOpen, onMove }: TaskListViewProps) {
  return (
    <div className={cn(panelCard, "overflow-hidden")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-208 border-collapse text-left text-[13px]">
          <caption className="sr-only">Tareas del proyecto con estado, prioridad, responsable y fecha límite</caption>
          <thead>
            <tr className="bg-hub-subtle text-[11px] uppercase tracking-wider text-hub-muted">
              <th scope="col" className="px-4 py-3 font-semibold">Tarea</th>
              <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-4 py-3 font-semibold">Prioridad</th>
              <th scope="col" className="px-4 py-3 font-semibold">Responsable</th>
              <th scope="col" className="px-4 py-3 font-semibold">Fecha límite</th>
              {showSprint && <th scope="col" className="px-4 py-3 font-semibold">Sprint</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-hub-border">
            {tasks.map((task) => {
              const overdue = isOverdue(task, today), done = task.status === "done";
              return (
                <tr key={task.id} aria-busy={moving === task.id} className={cn("align-top transition-colors hover:bg-hub-hover", moving === task.id && "opacity-60")}>
                  <td className="max-w-96 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(task)}
                      aria-haspopup="dialog"
                      className={cn("break-words text-left font-medium text-hub-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent", done && "line-through decoration-hub-muted")}
                    >
                      {task.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {task.permissions.canChangeStatus ? (
                      <OptionSelect
                        id={`lista-estado-${task.id}`}
                        aria-label={`Estado de «${task.title}»`}
                        options={STATUS_OPTIONS}
                        value={task.status}
                        disabled={moving !== null}
                        className="h-8 w-40 text-xs"
                        onValueChange={(value) => isTaskStatus(value) && onMove(task, value)}
                      />
                    ) : (
                      <span className={STATUS_CHIP[task.status]}>{TASK_STATUS_LABELS[task.status]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><PriorityChip priority={task.priority} /></td>
                  <td className="max-w-56 px-4 py-3"><Assignee task={task} /></td>
                  <td className="px-4 py-3">
                    {task.dueDate ? (
                      <span className={cn("flex items-center gap-1.5", overdue ? "font-semibold text-hub-field-error" : "text-hub-soft")} title={formatCalendarDate(task.dueDate) ?? undefined}>
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {formatShortDay(task.dueDate)}
                        {overdue && <span className={dangerChip}>Venció {overdueLabel(task.dueDate, today).toLowerCase()}</span>}
                      </span>
                    ) : <span className="text-hub-muted">Sin fecha</span>}
                  </td>
                  {showSprint && <td className="px-4 py-3 text-hub-muted">{(task.sprintId && sprintNames.get(task.sprintId)) || "Backlog"}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
