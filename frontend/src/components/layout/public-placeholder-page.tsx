import { Sparkles } from "lucide-react";

import { PublicPageShell } from "@/components/layout/public-page-shell";
import { SectionEmptyState } from "@/components/ui/section-empty-state";
import { PublicationsEmptyState } from "@/features/publications/components/publications-empty-state";
import { TeamEmptyState } from "@/features/team/components/team-empty-state";

type PublicPlaceholderPageProps = {
  title: string;
  description: string;
};

export function PublicPlaceholderPage({
  title,
  description,
}: PublicPlaceholderPageProps) {
  const lowerTitle = title.toLowerCase();

  let content = (
    <SectionEmptyState
      categoryLabel="Módulo en Preparación"
      categoryIcon={Sparkles}
      statusLabel="SINCRONIZACIÓN EN CURSO"
      title={title}
      moduleCode="SGPAI::MODULE::WORKSPACE"
      description={<p>{description}</p>}
    />
  );

  if (lowerTitle.includes("equipo")) {
    content = <TeamEmptyState />;
  } else if (lowerTitle.includes("publicaci")) {
    content = <PublicationsEmptyState />;
  }

  return <PublicPageShell>{content}</PublicPageShell>;
}
