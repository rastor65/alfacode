import { Building2, GraduationCap, Megaphone, MapPin, MonitorSmartphone, Presentation, Shapes, Users, Video, type LucideIcon } from "lucide-react";

import type { EVENT_MODES, EVENT_TYPES, EventStatus } from "../types";

/** Cada estado lleva etiqueta de texto: el color nunca es la unica senal. */
export const STATUS_TONE: Record<EventStatus, string> = {
  scheduled: "bg-hub-accent-soft text-hub-accent",
  in_progress: "bg-hub-info-bg text-hub-info-text",
  completed: "bg-hub-success-bg text-hub-success-text",
  cancelled: "bg-hub-badge-bg text-hub-badge-text",
};

export const STATUS_BAR: Record<EventStatus, string> = {
  scheduled: "bg-hub-series-1",
  in_progress: "bg-hub-series-2",
  completed: "bg-hub-series-4",
  cancelled: "bg-hub-muted",
};

export const TYPE_ICON: Record<keyof typeof EVENT_TYPES, LucideIcon> = {
  meeting: Users,
  training: GraduationCap,
  academic: Presentation,
  call: Megaphone,
  internal: Building2,
  other: Shapes,
};

export const MODE_ICON: Record<keyof typeof EVENT_MODES, LucideIcon> = {
  onsite: MapPin,
  online: Video,
  hybrid: MonitorSmartphone,
};
