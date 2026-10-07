import { Database, FileText, FolderKanban, Users } from "lucide-react";

import { MetricCard } from "@/components/data-display/metric-card";
import { projects, researchLines, technologies } from "@/features/projects/data/project-seed";
import type { DashboardMetric } from "@/types/domain";

const metrics: DashboardMetric[] = [
  {
    label: "Proyectos activos",
    value: String(projects.filter((project) => project.status !== "ARCHIVED").length),
    detail: "Incluye investigacion, diseno, desarrollo y validacion.",
  },
  {
    label: "Lineas",
    value: String(researchLines.length),
    detail: "Catalogo administrable desde PostgreSQL.",
  },
  {
    label: "Tecnologias",
    value: String(technologies.length),
    detail: "Reutilizables en multiples proyectos.",
  },
  {
    label: "Publicaciones",
    value: "0",
    detail: "Modulo listo para conectar a la base de datos.",
  },
];

const nextModules = [
  { icon: FolderKanban, label: "Proyectos", href: "/app/proyectos" },
  { icon: Users, label: "Integrantes", href: "/app/integrantes" },
  { icon: FileText, label: "Publicaciones", href: "/app/publicaciones" },
  { icon: Database, label: "Modelo de datos", href: "/app/configuracion" },
];

export default function DashboardPage() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7ed4e8]">
        Plataforma interna
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Dashboard</h1>
      <p className="mt-3 max-w-3xl text-slate-400">
        Vista inicial enfocada en informacion operativa. Los datos actuales son
        semillas de desarrollo y seran reemplazados por consultas a PostgreSQL.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-lg font-semibold text-white">Modulos siguientes</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {nextModules.map((module) => (
            <a
              key={module.label}
              href={module.href}
              className="rounded-md border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300 transition hover:border-[#469eb4]/60 hover:text-white"
            >
              <module.icon className="mb-4 text-[#7ed4e8]" size={20} aria-hidden="true" />
              {module.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
