import { PublicResearchPage } from "@/features/research/components/public-research-page";
import { getPublicResearchLines } from "@/features/research/services/research-repository";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const researchLines = await getPublicResearchLines();

  return <PublicResearchPage researchLines={researchLines} />;
}
