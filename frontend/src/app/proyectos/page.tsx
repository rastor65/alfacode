import type { Metadata } from "next";

import { PublicPageShell } from "@/components/layout/public-page-shell";
import { projects } from "@/data/portfolio";
import { PublicProjectsPage } from "@/features/projects/components/public-projects-page";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Proyectos públicos de investigación y desarrollo de AlfaCode.",
};

export default function ProjectsPage() {
  const hasContent = Boolean(projects && projects.length > 0);
  return (
    <PublicPageShell withInteractiveBackground={hasContent}>
      <PublicProjectsPage projects={projects} />
    </PublicPageShell>
  );
}
