import type { Project, ResearchLine } from "@/types/domain";
import { AlfaLanding } from "./alfa-landing";

type HomePageProps = {
  featuredProjects: Project[];
  researchLines: ResearchLine[];
};

export function HomePage({ featuredProjects, researchLines }: HomePageProps) {
  return (
    <AlfaLanding featuredProjects={featuredProjects} researchLines={researchLines} />
  );
}
