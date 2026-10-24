"use client";

import { PanelError } from "@/features/tracking/components/panel-states";

export default function TrackingError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <PanelError title="Reportes" retry={retry} />;
}
