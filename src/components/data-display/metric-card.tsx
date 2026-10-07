import type { DashboardMetric } from "@/types/domain";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-slate-400">{metric.label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
      <p className="mt-2 text-sm text-cyan-100/70">{metric.detail}</p>
    </div>
  );
}
