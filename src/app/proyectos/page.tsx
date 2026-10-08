import type { Metadata } from "next";

import { PublicProjectsPage } from "@/features/projects/components/public-projects-page";
import { getPublicProjects } from "@/features/projects/services/project-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Proyectos publicos de investigacion y desarrollo de AlfaCode.",
};

export default async function ProjectsPage() {
  const projects = await getPublicProjects();

  return <PublicProjectsPage projects={projects} />;
}
