import { researchLines } from "@/data/portfolio";
import { PublicResearchPage } from "@/features/research/components/public-research-page";

export default function ResearchPage() {
  return <PublicResearchPage researchLines={researchLines} />;
}
