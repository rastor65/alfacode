import { PublicPageShell } from "@/components/layout/public-page-shell";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/domain";

type ProjectDetailPageProps = {
  project: Project;
};

export function ProjectDetailPage({ project }: ProjectDetailPageProps) {
  return (
    <PublicPageShell maxWidth="narrow">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
        {project.status}
      </p>
      <h1 className="mt-4 text-4xl font-semibold text-white">{project.name}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
        {project.summary}
      </p>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <ProjectDetailSection title="Problematica">
          {project.problemStatement}
        </ProjectDetailSection>
        <ProjectDetailSection title="Objetivo">{project.objective}</ProjectDetailSection>
      </div>

      <ProjectDetailSection title="Solucion" className="mt-8">
        {project.solution}
      </ProjectDetailSection>

      <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold text-white">Tecnologias</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.technologies.map((technology) => (
            <Badge key={technology.id}>{technology.name}</Badge>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}

function ProjectDetailSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-white/10 bg-white/[0.04] p-6 ${className}`}
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{children}</p>
    </section>
  );
}
