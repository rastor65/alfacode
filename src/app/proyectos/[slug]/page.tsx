import { notFound } from "next/navigation";

import { PublicHeader } from "@/components/layout/public-header";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/features/projects/data/project-seed";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  return {
    title: project?.name ?? "Proyecto",
    description: project?.summary,
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#05080d]">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
          {project.status}
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">{project.name}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          {project.summary}
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-semibold text-white">Problematica</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {project.problemStatement}
            </p>
          </section>
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-semibold text-white">Objetivo</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {project.objective}
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">Tecnologias</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.technologies.map((technology) => (
              <Badge key={technology.id}>{technology.name}</Badge>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
