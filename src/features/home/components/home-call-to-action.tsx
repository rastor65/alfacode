import { ArrowRight, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";

export function HomeCallToAction() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="glass-panel mx-auto grid max-w-7xl gap-8 rounded-lg p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Sparkles className="text-[#7ed4e8]" size={24} aria-hidden="true" />
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold text-white">
            No necesitas tener todas las respuestas. Necesitas una pregunta que
            valga la pena investigar.
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            AlfaCode busca estudiantes interesados en crear, investigar,
            experimentar y construir productos tecnologicos con impacto.
          </p>
        </div>
        <ButtonLink href="/contacto" className="gap-2">
          Quiero ser parte
          <ArrowRight size={16} aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
