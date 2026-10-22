"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** F6-08: estado de error de paneles y reportes; el detalle tecnico queda en los registros del servidor. */
export function PanelError({ retry, title }: { retry: () => void; title: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4" role="alert">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <Alert tone="error">No se pudieron calcular los datos en este momento. Intenta de nuevo en unos minutos.</Alert>
      <Button variant="neutral" onClick={() => retry()}>Reintentar</Button>
    </div>
  );
}

/** Esqueleto de carga accesible: anuncia la espera sin mostrar cifras provisionales. */
export function PanelLoading({ label }: { label: string }) {
  return (
    <div className="w-full" aria-busy="true">
      <p role="status" className="text-sm text-hub-muted">{label}</p>
      <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl border border-hub-border bg-hub-subtle motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
