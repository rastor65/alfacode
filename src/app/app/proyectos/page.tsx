import { Badge } from "@/components/ui/badge";
import { getAllProjectsForAdmin } from "@/features/projects/services/project-repository";

export const dynamic = "force-dynamic";

export default async function InternalProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#347f92]">
            Gestion
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10242c]">Proyectos</h1>
          <p className="mt-3 max-w-3xl text-[#5d7179]">
            Primer listado administrativo conectado a PostgreSQL. El siguiente
            paso sera agregar CRUD, RLS por usuario y formularios.
          </p>
        </div>
        <button className="min-h-11 rounded-md bg-[#347f92] px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(52,127,146,0.18)] transition hover:bg-[#286273]">
          Nuevo proyecto
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-[#d5e6ea] bg-white shadow-[0_2px_8px_rgba(8,21,27,0.05)]">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-[#eef7f9] text-[#29404a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Proyecto</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Visibilidad</th>
              <th className="px-4 py-3 font-semibold">Tecnologias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d5e6ea]">
            {projects.map((project) => (
              <tr key={project.id} className="transition hover:bg-[#f7fbfc]">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[#10242c]">{project.name}</p>
                  <p className="mt-1 text-xs text-[#5d7179]">{project.slug}</p>
                </td>
                <td className="px-4 py-4 text-[#29404a]">{project.status}</td>
                <td className="px-4 py-4 text-[#29404a]">{project.visibility}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.slice(0, 3).map((technology) => (
                      <Badge
                        key={technology.id}
                        className="border-[#469eb4]/15 bg-[#469eb4]/10 text-[#286273]"
                      >
                        {technology.name}
                      </Badge>
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
