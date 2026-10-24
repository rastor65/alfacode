import type { ProjectStatus } from "@/features/projects/types";

/** Estilos compartidos del panel del semillero (I-26), sobre los tokens del HUB para ambos temas. */
export const panelCard = "rounded-xl border border-hub-border bg-hub-panel shadow-(--hub-panel-shadow)";
export const chip = "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium leading-4";
export const dangerChip = `${chip} bg-hub-danger-bg text-hub-danger-text`;
export const neutralChip = `${chip} bg-hub-badge-bg text-hub-badge-text`;
export const eyebrow = "text-[11px] font-semibold uppercase tracking-wider text-hub-muted";

export const STATUS_CHIP: Record<ProjectStatus, string> = {
  active: `${chip} bg-hub-accent-soft text-hub-accent`,
  planning: `${chip} bg-hub-info-bg text-hub-info-text`,
  proposed: neutralChip,
  paused: neutralChip,
  completed: `${chip} bg-hub-success-bg text-hub-success-text`,
  cancelled: neutralChip,
};
