import { PublicHeader } from "@/components/layout/public-header";
import { PublicThemeProvider } from "@/components/theme/public-theme-provider";
import { HomeCallToAction } from "@/features/home/components/home-call-to-action";
import { HomeFeaturedProjectsSection } from "@/features/home/components/home-featured-projects-section";
import { HomeFooter } from "@/features/home/components/home-footer";
import { HomeHeroSection } from "@/features/home/components/home-hero-section";
import { HomeMethodCarousel } from "@/features/home/components/home-method-carousel";
import { HomePrinciplesSection } from "@/features/home/components/home-principles-section";
import { HomeResearchLinesSection } from "@/features/home/components/home-research-lines-section";
import { TechInteractiveBackground } from "@/features/home/components/tech-interactive-background";
import type { Project, ResearchLine } from "@/types/domain";

type HomePageProps = {
  featuredProjects: Project[];
  researchLines: ResearchLine[];
};

export function HomePage({ featuredProjects, researchLines }: HomePageProps) {
  return (
    <PublicThemeProvider className="bg-site-bg relative overflow-x-hidden">
      <TechInteractiveBackground />
      <PublicHeader />
      <main className="relative z-10">
        <HomeHeroSection />
        <HomePrinciplesSection />
        <HomeFeaturedProjectsSection projects={featuredProjects} />
        <HomeResearchLinesSection researchLines={researchLines} />
        <HomeMethodCarousel />
        <HomeCallToAction />
      </main>
      <HomeFooter />
    </PublicThemeProvider>
  );
}
