import { AlarmClock, CalendarX, History, TrendingDown, type LucideIcon } from "lucide-react";

import { chip } from "./dashboard-ui";
import type { RiskCode } from "../types";

type RiskSubject = { risks: RiskCode[]; overdue: number; elapsed: number | null; tasks: { progress: number | null } };
export const RISK_DETAIL: Record<RiskCode, { icon: LucideIcon; text: (project: RiskSubject) => string }> = {
  overdue_tasks: { icon: AlarmClock, text: (project) => `Tareas vencidas: ${project.overdue}` },
  behind_schedule: { icon: TrendingDown, text: (project) => `Avance retrasado: Δ${(project.elapsed ?? 0) - (project.tasks.progress ?? 0)} pts` },
  past_end_date: { icon: CalendarX, text: () => "Fecha de fin superada" },
  inactive: { icon: History, text: () => "Sin actividad en 14 días" },
};

/** Cada alerta lleva icono y texto: el color nunca es la unica senal. */
export function RiskChips({ project }: { project: RiskSubject }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Alertas">
      {project.risks.map((risk) => {
        const { icon: Icon, text } = RISK_DETAIL[risk];
        return <li key={risk} className={`${chip} bg-hub-danger-bg text-hub-danger-text`}><Icon aria-hidden="true" className="size-3" />{text(project)}</li>;
      })}
    </ul>
  );
}
