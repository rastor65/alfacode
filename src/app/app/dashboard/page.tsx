import { Database, FileText, FolderKanban, Users } from "lucide-react";

import { MetricCard } from "@/components/data-display/metric-card";
import { getDashboardSummary } from "@/features/dashboard/services/dashboard-repository";
import type { DashboardMetric } from "@/types/domain";

export const dynamic = "force-dynamic";

const nextModules = [
  { icon: FolderKanban, label: "Proyectos", href: "/app/proyectos" },
  { icon: Users, label: "Integrantes", href: "/app/integrantes" },
  { icon: FileText, label: "Publicaciones", href: "/app/publicaciones" },
  { icon: Database, label: "Modelo de datos", href: "/app/configuracion" },
];

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

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#347f92]">
        Plataforma interna
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[#10242c]">Dashboard</h1>
      <p className="mt-3 max-w-3xl text-[#5d7179]">
        Vista inicial enfocada en informacion operativa y procesos criticos del
        semillero. Los indicadores se alimentan desde PostgreSQL.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-[#d5e6ea] bg-[#f7fbfc] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#10242c]">
              Accesos operativos
            </h2>
            <p className="mt-1 text-sm text-[#5d7179]">
              Modulos frecuentes para gestion diaria.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {nextModules.map((module) => (
            <a
              key={module.label}
              href={module.href}
              className="rounded-lg border border-[#d5e6ea] bg-white p-4 text-sm font-medium text-[#29404a] shadow-[0_2px_8px_rgba(8,21,27,0.04)] transition hover:border-[#469eb4] hover:text-[#286273]"
            >
              <module.icon className="mb-4 text-[#347f92]" size={20} aria-hidden="true" />
              {module.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
