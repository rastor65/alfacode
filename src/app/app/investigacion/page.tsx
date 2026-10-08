import { InternalResearchPage as InternalResearchView } from "@/features/research/components/internal-research-page";
import { getAllResearchLinesForAdmin } from "@/features/research/services/research-repository";

export const dynamic = "force-dynamic";

export default async function InternalResearchPage() {
  const researchLines = await getAllResearchLinesForAdmin();

  return <InternalResearchView researchLines={researchLines} />;
}
