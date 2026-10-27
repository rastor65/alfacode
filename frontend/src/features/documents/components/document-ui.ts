import { FileSpreadsheet, FileText, Globe, Image as ImageIcon, Lock, Presentation, Shield, type LucideIcon } from "lucide-react";

import { chip, neutralChip } from "@/features/tracking/components/dashboard-ui";

import type { AccessLevel, FileFamily } from "../types";

/** Cada familia de archivo lleva icono y texto (la extension): el color nunca es la unica senal. */
export const FILE_STYLE: Record<FileFamily, { icon: LucideIcon; tone: string }> = {
  pdf: { icon: FileText, tone: "bg-hub-danger-bg text-hub-danger-text" },
  word: { icon: FileText, tone: "bg-hub-info-bg text-hub-info-text" },
  sheet: { icon: FileSpreadsheet, tone: "bg-hub-success-bg text-hub-success-text" },
  slides: { icon: Presentation, tone: "bg-hub-accent-soft text-hub-accent" },
  image: { icon: ImageIcon, tone: "bg-hub-badge-bg text-hub-badge-text" },
  other: { icon: FileText, tone: "bg-hub-badge-bg text-hub-badge-text" },
};

export const ACCESS_STYLE: Record<AccessLevel, { icon: LucideIcon; tone: string; bar: string }> = {
  general: { icon: Globe, tone: neutralChip, bar: "bg-hub-series-1" },
  restricted: { icon: Shield, tone: `${chip} bg-hub-info-bg text-hub-info-text`, bar: "bg-hub-series-2" },
  private: { icon: Lock, tone: `${chip} bg-hub-accent-soft text-hub-accent`, bar: "bg-hub-series-3" },
};

export const primaryButton =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg";
export const iconButton =
  "flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-50";
