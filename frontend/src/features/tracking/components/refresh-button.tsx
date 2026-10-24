"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Vuelve a pedir los indicadores al servidor; no hay corte automatico. */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hub-border bg-hub-subtle px-3 text-sm font-medium text-hub-text transition hover:bg-hub-hover active:scale-95 disabled:opacity-70"
    >
      <RefreshCw aria-hidden="true" className={pending ? "size-4 animate-spin text-hub-accent motion-reduce:animate-none" : "size-4 text-hub-accent"} />
      {pending ? "Actualizando…" : "Actualizar"}
    </button>
  );
}
