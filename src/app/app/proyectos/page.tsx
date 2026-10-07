import { Badge } from "@/components/ui/badge";
import { projects } from "@/features/projects/data/project-seed";

export default function InternalProjectsPage() {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7ed4e8]">
            Gestion
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Proyectos</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Primer listado administrativo. El siguiente paso sera conectar CRUD,
            RLS y formularios contra PostgreSQL.
          </p>
        </div>
        <button className="min-h-11 rounded-md bg-[#469eb4] px-4 text-sm font-semibold text-slate-950">
          Nuevo proyecto
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-white/[0.06] text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Proyecto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Visibilidad</th>
              <th className="px-4 py-3 font-medium">Tecnologias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {projects.map((project) => (
              <tr key={project.id} className="bg-white/[0.025]">
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{project.name}</p>
                  <p className="mt-1 text-slate-400">{project.slug}</p>
                </td>
                <td className="px-4 py-4 text-slate-300">{project.status}</td>
                <td className="px-4 py-4 text-slate-300">{project.visibility}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.slice(0, 3).map((technology) => (
                      <Badge key={technology.id}>{technology.name}</Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
