"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/format";
import { REQUEST_STATUSES, REQUEST_TYPES, type RequestItem } from "../types";
import { RequestForm } from "./request-form";

export function RequestsCatalog({ items }: { items: RequestItem[] }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="neutral" className="min-h-11" aria-haspopup="dialog" onClick={() => setOpen(true)}>Nueva solicitud</Button>
    {items.length ? <ul className="mt-4 divide-y divide-hub-border rounded-xl border border-hub-border">{items.map(row => <li key={row.id}><Link href={`/hub/tramites/${row.id}`} className="flex min-h-16 flex-wrap justify-between gap-3 rounded-xl p-4 hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><span className="min-w-0 flex-1"><span className="block break-words font-medium">{row.subject}</span><span className="mt-1 block text-sm text-hub-muted">{REQUEST_TYPES[row.type]} · {row.requester.fullName}</span><span className="mt-1 block text-xs text-hub-muted">{formatDateTime(row.createdAt)} · {row.reviewer ? `Responsable: ${row.reviewer.fullName}` : "Sin responsable asignado"}</span></span><Badge>{REQUEST_STATUSES[row.status]}</Badge></Link></li>)}</ul> : <p className="mt-4 rounded-xl border border-dashed border-hub-border px-4 py-8 text-center text-sm text-hub-muted">No hay solicitudes para los filtros actuales.</p>}
    <Modal open={open} onClose={() => setOpen(false)} title="Nueva solicitud" size="lg"><RequestForm onCancel={() => setOpen(false)} /></Modal>
  </>;
}
