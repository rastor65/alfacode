import { HomePage } from "@/features/home/components/home-page";
import { projects, researchLines } from "@/data/portfolio";

export default function Home() {
  return (
    <HomePage
      featuredProjects={projects}
      researchLines={researchLines}
    />
  );
}
