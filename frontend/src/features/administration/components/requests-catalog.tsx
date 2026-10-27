import { ArrowRight, CircleAlert, UserRound } from "lucide-react";
import Link from "next/link";

import { eyebrow, panelCard } from "@/features/tracking/components/dashboard-ui";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { REQUEST_STATUSES, REQUEST_TYPES, type RequestItem } from "../types";
import { STATUS_STYLE, TYPE_ICON } from "./request-ui";

/** Una fila por solicitud: solicitante, asunto y tipo, responsable, estado y enlace al detalle. */
export function RequestsCatalog({ items, emptyMessage }: { items: RequestItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">{emptyMessage}</p>;
  }

  return (
    <section aria-label="Lista de solicitudes" className={cn(panelCard, "overflow-hidden")}>
      <div aria-hidden="true" className={cn(eyebrow, "hidden grid-cols-12 items-center gap-4 bg-hub-subtle px-5 py-3 lg:grid")}>
        <span className="col-span-3">Solicitante</span>
        <span className="col-span-4">Asunto y tipo</span>
        <span className="col-span-2">Responsable</span>
        <span className="col-span-2">Estado</span>
        <span className="col-span-1 text-right">Acción</span>
      </div>
      <ul className="divide-y divide-hub-border">
        {items.map((row) => (
          <RequestRow key={row.id} row={row} />
        ))}
      </ul>
    </section>
  );
}

function RequestRow({ row }: { row: RequestItem }) {
  const { icon: StatusIcon, tone } = STATUS_STYLE[row.status];
  const TypeIcon = TYPE_ICON[row.type];
  const open = row.status === "pending" || row.status === "in_review";
  const missing = open && !row.reviewer;

  return (
    <li className="grid grid-cols-1 items-start gap-3 px-5 py-4 transition-colors hover:bg-hub-hover/60 lg:grid-cols-12 lg:gap-4">
      <div className="flex min-w-0 flex-col gap-0.5 lg:col-span-3">
        <span className="truncate text-sm font-medium text-hub-text">{row.requester.fullName}</span>
        <span className="text-xs text-hub-muted">
          <time dateTime={row.createdAt}>{formatDateTime(row.createdAt)}</time>
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 lg:col-span-4">
        <Link
          href={`/hub/tramites/${row.id}`}
          className="line-clamp-2 wrap-break-word rounded text-sm font-semibold text-hub-text transition-colors hover:text-hub-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
        >
          {row.subject}
        </Link>
        <span className="inline-flex items-center gap-1 self-start rounded bg-hub-subtle px-2 py-0.5 text-[11px] font-medium text-hub-soft">
          <TypeIcon aria-hidden="true" className="size-3 text-hub-accent" />
          {REQUEST_TYPES[row.type]}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5 lg:col-span-2">
        {row.reviewer ? (
          <span className="flex items-center gap-1.5 text-sm text-hub-text">
            <UserRound aria-hidden="true" className="size-4 shrink-0 text-hub-accent" />
            <span className="truncate">{row.reviewer.fullName}</span>
          </span>
        ) : (
          <span className={cn("flex items-center gap-1.5 text-sm", missing ? "font-medium text-hub-field-error" : "text-hub-muted")}>
            {missing && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
            Sin responsable
          </span>
        )}
        {missing && <span className="text-xs text-hub-muted">Requiere asignación</span>}
      </div>

      <div className="lg:col-span-2">
        <span className={`${tone} gap-1.5 rounded-full px-2.5 py-1`}>
          <StatusIcon aria-hidden="true" className="size-3" />
          {REQUEST_STATUSES[row.status]}
        </span>
      </div>

      <div className="lg:col-span-1 lg:text-right">
        <Link
          href={`/hub/tramites/${row.id}`}
          className="group inline-flex items-center gap-1 rounded text-sm font-semibold text-hub-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
        >
          Detalle<span className="sr-only">: {row.subject}</span>
          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </li>
  );
}
