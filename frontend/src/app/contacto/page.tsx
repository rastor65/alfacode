import type { Metadata } from "next";

import { PublicPageShell } from "@/components/layout/public-page-shell";
import { ContactPage as ContactView } from "@/features/contact/components/contact-page";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Canales oficiales de vinculación, proyectos y colaboración con el semillero AlfaCode.",
};

export default function ContactPage() {
  return (
    <PublicPageShell withInteractiveBackground>
      <ContactView />
    </PublicPageShell>
  );
}
