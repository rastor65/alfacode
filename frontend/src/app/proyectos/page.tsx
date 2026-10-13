import type { Metadata } from "next";

import { projects } from "@/data/portfolio";
import { PublicProjectsPage } from "@/features/projects/components/public-projects-page";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Proyectos publicos de investigacion y desarrollo de AlfaCode.",
};

export default function ProjectsPage() {
  return <PublicProjectsPage projects={projects} />;
}
