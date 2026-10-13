import { notFound } from "next/navigation";

import { getProjectBySlug, projects } from "@/data/portfolio";
import { ProjectDetailPage as ProjectDetailView } from "@/features/projects/components/project-detail-page";

export const dynamicParams = false;

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  return {
    title: project?.name ?? "Proyecto",
    description: project?.summary,
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
