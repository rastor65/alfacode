import { HomePage } from "@/features/home/components/home-page";
import { getPublicProjects } from "@/features/projects/services/project-repository";
import { getPublicResearchLines } from "@/features/research/services/research-repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, researchLines] = await Promise.all([
    getPublicProjects(),
    getPublicResearchLines(),
  ]);
  const featuredProjects = projects.slice(0, 3);

  return (
    <HomePage
      featuredProjects={featuredProjects}
      researchLines={researchLines}
    />
  );
}
