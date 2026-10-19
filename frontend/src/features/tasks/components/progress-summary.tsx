import { cn } from "@/lib/utils";

import { type ProjectProgress, TASK_STATUSES, TASK_STATUS_LABELS, describeProgress } from "../types";

type ProgressSummaryProps = {
  progress: ProjectProgress;
  /** `compact`: una linea para listados; `full`: barra y conteos por estado. */
  variant?: "compact" | "full";
  className?: string;
};

/** F2-12: tareas hechas sobre el total; es avance de tareas, no cumplimiento del proyecto. */
export function ProgressSummary({ progress, variant = "full", className }: ProgressSummaryProps) {
  const { label, percent } = describeProgress(progress);

  if (variant === "compact") {
    return <span className={className}>{label}</span>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-hub-text">{label}</p>
        {percent !== null && <p className="text-sm text-hub-muted">{percent} % de las tareas</p>}
      </div>
      {percent !== null && (
        <div
          role="progressbar"
          aria-label="Tareas hechas"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-valuetext={label}
          className="h-2 overflow-hidden rounded-full bg-hub-hover"
        >
          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${percent}%` }} />
        </div>
      )}
      {progress.total > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-hub-muted">
          {TASK_STATUSES.map((status) => (
            <li key={status}>
              {TASK_STATUS_LABELS[status]}: <span className="font-medium text-hub-soft">{progress.byStatus[status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
