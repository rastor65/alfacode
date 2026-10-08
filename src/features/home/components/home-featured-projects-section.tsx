import { ButtonLink } from "@/components/ui/button-link";
import { ProjectCard } from "@/features/projects/components/project-card";
import type { Project } from "@/types/domain";

type HomeFeaturedProjectsSectionProps = {
  projects: Project[];
};

export function HomeFeaturedProjectsSection({
  projects,
}: HomeFeaturedProjectsSectionProps) {
  return (
    <section className="section-light border-y border-cyan-950/10">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#287f92]">
              Proyectos
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-[#071822] sm:text-4xl">
              Los proyectos cuentan la historia tecnica de AlfaCode.
            </h2>
          </div>
          <ButtonLink
            href="/proyectos"
            variant="secondary"
            className="border-cyan-950/15 bg-white/70 text-[#08202b] hover:bg-white"
          >
            Ver todos
          </ButtonLink>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
