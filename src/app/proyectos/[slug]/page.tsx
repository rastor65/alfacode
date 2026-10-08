import { notFound } from "next/navigation";

import { ProjectDetailPage as ProjectDetailView } from "@/features/projects/components/project-detail-page";
import { getPublicProjectBySlug } from "@/features/projects/services/project-repository";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  return {
    title: project?.name ?? "Proyecto",
    description: project?.summary,
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}
