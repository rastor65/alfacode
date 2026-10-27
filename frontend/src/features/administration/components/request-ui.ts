import { BadgeCheck, CircleCheck, CircleX, ClipboardList, FileText, Hourglass, RefreshCw, Repeat, UserMinus, UserPen, type LucideIcon } from "lucide-react";

import { chip, neutralChip } from "@/features/tracking/components/dashboard-ui";

import type { REQUEST_TYPES, RequestStatus } from "../types";

/** Cada estado lleva icono y texto: el color nunca es la unica senal. */
export const STATUS_STYLE: Record<RequestStatus, { icon: LucideIcon; tone: string }> = {
  pending: { icon: Hourglass, tone: neutralChip },
  in_review: { icon: RefreshCw, tone: `${chip} bg-hub-info-bg text-hub-info-text` },
  approved: { icon: CircleCheck, tone: `${chip} bg-hub-success-bg text-hub-success-text` },
  rejected: { icon: CircleX, tone: `${chip} bg-hub-danger-bg text-hub-danger-text` },
  completed: { icon: ClipboardList, tone: `${chip} bg-hub-accent-soft text-hub-accent` },
};

export const TYPE_ICON: Record<keyof typeof REQUEST_TYPES, LucideIcon> = {
  certificate: BadgeCheck,
  data_change: UserPen,
  withdrawal: UserMinus,
  responsibility_change: Repeat,
  general: FileText,
};
