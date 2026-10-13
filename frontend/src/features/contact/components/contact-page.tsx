import { Mail } from "lucide-react";

import { PublicPageShell } from "@/components/layout/public-page-shell";
import { ButtonLink } from "@/components/ui/button-link";

export function ContactPage() {
  return (
    <PublicPageShell>
      <h1 className="text-4xl font-semibold text-white">Contacto</h1>
      <p className="mt-4 max-w-3xl text-slate-300">
        Punto de entrada para colaboraciones, aliados, solicitudes de
        informacion y procesos de vinculacion al semillero.
      </p>
      <ButtonLink href="mailto:contacto@alfacode.dev" className="mt-8 gap-2">
        <Mail size={16} aria-hidden="true" />
        Escribir a AlfaCode
      </ButtonLink>
    </PublicPageShell>
  );
}
