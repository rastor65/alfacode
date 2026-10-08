import { DashboardPage as DashboardView } from "@/features/dashboard/components/dashboard-page";
import { getDashboardSummary } from "@/features/dashboard/services/dashboard-repository";
import type { DashboardMetric } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  const metrics: DashboardMetric[] = [
    {
      label: "Proyectos activos",
      value: String(summary.activeProjects),
      detail: "Incluye investigacion, diseno, desarrollo y validacion.",
    },
    {
      label: "Lineas",
      value: String(summary.researchLines),
      detail: "Catalogo administrable desde PostgreSQL.",
    },
    {
      label: "Tecnologias",
      value: String(summary.technologies),
      detail: "Reutilizables en multiples proyectos.",
    },
    {
      label: "Publicaciones",
      value: String(summary.publications),
      detail: "Produccion academica registrada en la plataforma.",
    },
  ];

  return <DashboardView metrics={metrics} />;
}
