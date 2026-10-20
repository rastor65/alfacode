import type { Metadata } from "next";

import { PublicPageShell } from "@/components/layout/public-page-shell";
import { teamMembers } from "@/data/portfolio";
import { PublicTeamPage } from "@/features/team/components/public-team-page";

export const metadata: Metadata = {
  title: "Equipo",
  description:
    "Docentes, estudiantes e investigadores del semillero de investigación AlfaCode.",
};

export default function TeamPage() {
  const hasContent = Boolean(teamMembers && teamMembers.length > 0);
  return (
    <PublicPageShell withInteractiveBackground={hasContent}>
      <PublicTeamPage members={teamMembers} />
    </PublicPageShell>
  );
}
