import { HomePage } from "@/features/home/components/home-page";
import { projects, researchLines } from "@/data/portfolio";

export default function Home() {
  const featuredProjects = projects.slice(0, 3);

  return (
    <HomePage
      featuredProjects={featuredProjects}
      researchLines={researchLines}
    />
  );
}
