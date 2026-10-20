import type { Metadata } from "next";

import { PublicPageShell } from "@/components/layout/public-page-shell";
import { publications } from "@/data/portfolio";
import { PublicPublicationsPage } from "@/features/publications/components/public-publications-page";

export const metadata: Metadata = {
  title: "Publicaciones",
  description:
    "Producción científica, ponencias en congresos y desarrollo tecnológico del semillero AlfaCode.",
};

export default function PublicationsPage() {
  const hasContent = Boolean(publications && publications.length > 0);
  return (
    <PublicPageShell withInteractiveBackground={hasContent}>
      <PublicPublicationsPage publications={publications} />
    </PublicPageShell>
  );
}
