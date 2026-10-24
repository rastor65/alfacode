import { ChevronDown, ChevronsUp, Minus, type LucideIcon } from "lucide-react";

import { chip, dangerChip, neutralChip } from "@/features/tracking/components/dashboard-ui";

import type { TaskPriority, TaskStatus } from "../types";

/** Mismo color por estado que el anillo de los paneles y el progreso del resumen (series 1 a 4, validadas para daltonismo). */
export const STATUS_DOT: Record<TaskStatus, string> = { todo: "bg-hub-series-1", in_progress: "bg-hub-series-2", in_review: "bg-hub-series-3", done: "bg-hub-series-4" };

export const STATUS_CHIP: Record<TaskStatus, string> = {
  todo: neutralChip,
  in_progress: `${chip} bg-hub-accent-soft text-hub-accent`,
  in_review: `${chip} bg-hub-info-bg text-hub-info-text`,
  done: `${chip} bg-hub-success-bg text-hub-success-text`,
};

/** La prioridad lleva icono y texto: el color nunca es la unica senal. */
export const PRIORITY_STYLE: Record<TaskPriority, { icon: LucideIcon; className: string }> = {
  high: { icon: ChevronsUp, className: dangerChip },
  medium: { icon: Minus, className: neutralChip },
  low: { icon: ChevronDown, className: neutralChip },
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
