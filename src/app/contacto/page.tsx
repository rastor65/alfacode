import { Mail } from "lucide-react";

import { PublicHeader } from "@/components/layout/public-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#05080d]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-white">Contacto</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Punto de entrada para colaboraciones, aliados, solicitudes de
          informacion y procesos de vinculacion al semillero.
        </p>
        <ButtonLink href="mailto:contacto@alfacode.dev" className="mt-8 gap-2">
          <Mail size={16} aria-hidden="true" />
          Escribir a AlfaCode
        </ButtonLink>
      </main>
    </div>
  );
}
