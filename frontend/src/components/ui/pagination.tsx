import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { panelCard } from "@/features/tracking/components/dashboard-ui";
import { plural } from "@/features/tracking/types";
import { cn } from "@/lib/utils";

/** Numeros de pagina a mostrar: primera, ultima y la vecindad de la actual; `null` marca un salto. */
export function pageNumbers(current: number, last: number): (number | null)[] {
  const wanted = new Set([1, last, current - 1, current, current + 1].filter((page) => page >= 1 && page <= last));
  const sorted = [...wanted].sort((a, b) => a - b);
  const result: (number | null)[] = [];

  for (const page of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && page - previous > 1) result.push(page - previous === 2 ? previous + 1 : null);
    result.push(page);
  }

  return result;
}

type PaginationProps = {
  page: number;
  lastPage: number;
  total: number;
  shown: number;
  /** Singular y plural de lo que se cuenta, por ejemplo "documento autorizado". */
  noun: [string, string];
  hrefFor: (page: number) => string;
  label?: string;
};

const step = "inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

/** Paginacion por enlaces (funciona sin JavaScript): anterior, numeros y siguiente. */
export function Pagination({ page, lastPage, total, shown, noun, hrefFor, label = "Paginación" }: PaginationProps) {
  return (
    <nav aria-label={label} className={cn(panelCard, "flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row")}>
      <p className="text-xs text-hub-muted">
        <span className="font-semibold text-hub-text">
          Página {page} de {lastPage}
        </span>{" "}
        · Mostrando {shown} de {plural(total, noun[0], noun[1])}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={`${step} bg-hub-subtle text-hub-text hover:bg-hub-hover`}>
              <ChevronLeft aria-hidden="true" className="size-4" />
              Anterior
            </Link>
          ) : (
            <span aria-disabled="true" className={`${step} cursor-not-allowed bg-hub-subtle text-hub-muted opacity-50`}>
              <ChevronLeft aria-hidden="true" className="size-4" />
              Anterior
            </span>
          )}
        </li>
        {pageNumbers(page, lastPage).map((number, index) =>
          number === null ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-hub-muted">
              …
            </li>
          ) : (
            <li key={number} className="hidden sm:block">
              <Link
                href={hrefFor(number)}
                aria-current={number === page ? "page" : undefined}
                aria-label={`Página ${number}`}
                className={cn(step, "justify-center px-2.5 font-mono", number === page ? "bg-hub-accent font-semibold text-hub-bg" : "text-hub-muted hover:bg-hub-hover hover:text-hub-text")}
              >
                {number}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < lastPage ? (
            <Link href={hrefFor(page + 1)} className={`${step} bg-hub-subtle text-hub-text hover:bg-hub-hover`}>
              Siguiente
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span aria-disabled="true" className={`${step} cursor-not-allowed bg-hub-subtle text-hub-muted opacity-50`}>
              Siguiente
              <ChevronRight aria-hidden="true" className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
