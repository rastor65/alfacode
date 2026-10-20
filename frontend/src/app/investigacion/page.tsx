import type { Metadata } from "next";

import { PublicPageShell } from "@/components/layout/public-page-shell";
import { researchLines } from "@/data/portfolio";
import { PublicResearchPage } from "@/features/research/components/public-research-page";

export const metadata: Metadata = {
  title: "Investigación",
  description:
    "Líneas de investigación aplicada, inteligencia artificial y arquitectura de software de AlfaCode.",
};

export default function ResearchPage() {
  const hasContent = Boolean(researchLines && researchLines.length > 0);
  return (
    <PublicPageShell withInteractiveBackground={hasContent}>
      <PublicResearchPage researchLines={researchLines} />
    </PublicPageShell>
  );
}
