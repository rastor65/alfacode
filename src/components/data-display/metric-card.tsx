import type { DashboardMetric } from "@/types/domain";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="rounded-xl border border-[#d5e6ea] bg-white p-5 shadow-[0_2px_8px_rgba(8,21,27,0.05)]">
      <p className="text-sm font-medium text-[#5d7179]">{metric.label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#10242c]">{metric.value}</p>
      <p className="mt-2 text-sm leading-5 text-[#5d7179]">{metric.detail}</p>
    </div>
  );
}
