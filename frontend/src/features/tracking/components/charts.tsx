"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

/**
 * I-26: graficos de Recharts. Las cifras siempre se repiten en texto (leyenda o etiquetas), de modo
 * que el color nunca es la unica forma de leerlas; los tokens --hub-series-* estan validados para
 * daltonismo en ambos temas.
 */
type Datum = { key: string; label: string; value: number };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Datum }[] }) {
  const datum = active ? payload?.[0]?.payload : undefined;
  if (!datum) return null;
  return (
    <div className="rounded-lg border border-hub-border bg-hub-bg px-3 py-2 text-xs shadow-lg">
      <span className="text-hub-muted">{datum.label}: </span>
      <span className="font-semibold tabular-nums text-hub-text">{datum.value}</span>
    </div>
  );
}

// Clases completas y estaticas: Tailwind solo genera (y conserva los tokens de) las que encuentra escritas.
const SERIES = [
  { fill: "fill-hub-series-1", dot: "bg-hub-series-1" },
  { fill: "fill-hub-series-2", dot: "bg-hub-series-2" },
  { fill: "fill-hub-series-3", dot: "bg-hub-series-3" },
  { fill: "fill-hub-series-4", dot: "bg-hub-series-4" },
];

/** Anillo con leyenda de valores en texto; `centerLabel` rotula el total y `showPercent` agrega la proporcion. */
export function Donut({ labels, counts, empty, centerLabel = "en total", showPercent = false }: { labels: Record<string, string>; counts: Record<string, number>; empty: string; centerLabel?: string; showPercent?: boolean }) {
  const data: Datum[] = Object.entries(labels).map(([key, label]) => ({ key, label, value: counts[key] ?? 0 }));
  const total = data.reduce((acc, datum) => acc + datum.value, 0);
  if (total === 0) return <p className="mt-3 text-sm text-hub-muted">{empty}</p>;
  const visible = data.filter((datum) => datum.value > 0);
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-2">
      <div className="relative size-36 shrink-0" aria-hidden="true">
        <PieChart responsive style={{ width: "100%", height: "100%" }}>
          <Pie data={visible} dataKey="value" nameKey="label" innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270} paddingAngle={2} cornerRadius={4} stroke="var(--hub-bg)" strokeWidth={2} isAnimationActive={false}>
            {visible.map((datum) => <Cell key={datum.key} className={SERIES[data.indexOf(datum) % SERIES.length].fill} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
        <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none tabular-nums text-hub-text">{total}</span>
          <span className="mt-1 text-[11px] text-hub-muted">{centerLabel}</span>
        </span>
      </div>
      <dl className="min-w-40 flex-1 space-y-2 text-sm">
        {data.map((datum, index) => (
          <div key={datum.key} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${SERIES[index % SERIES.length].dot}`} />
            <dt className={datum.value ? "flex-1 truncate text-hub-text" : "flex-1 truncate text-hub-muted"}>{datum.label}</dt>
            <dd className="font-mono text-[13px] font-medium tabular-nums text-hub-text">{datum.value}{showPercent && <span className="text-hub-muted"> ({Math.round((datum.value * 100) / total)} %)</span>}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
