import { PublicHeader } from "@/components/layout/public-header";
import { HomeCallToAction } from "@/features/home/components/home-call-to-action";
import { HomeFeaturedProjectsSection } from "@/features/home/components/home-featured-projects-section";
import { HomeFooter } from "@/features/home/components/home-footer";
import { HomeHeroSection } from "@/features/home/components/home-hero-section";
import { HomeMethodSection } from "@/features/home/components/home-method-section";
import { HomePrinciplesSection } from "@/features/home/components/home-principles-section";
import { HomeResearchLinesSection } from "@/features/home/components/home-research-lines-section";
import type { Project, ResearchLine } from "@/types/domain";

type HomePageProps = {
  featuredProjects: Project[];
  researchLines: ResearchLine[];
};

export function HomePage({ featuredProjects, researchLines }: HomePageProps) {
  return (
    <div className="min-h-screen bg-[#071018]">
      <PublicHeader />
      <main>
        <HomeHeroSection />
        <HomePrinciplesSection />
        <HomeFeaturedProjectsSection projects={featuredProjects} />
        <HomeResearchLinesSection researchLines={researchLines} />
        <HomeMethodSection />
        <HomeCallToAction />
      </main>
      <HomeFooter />
    </div>
  );
}
