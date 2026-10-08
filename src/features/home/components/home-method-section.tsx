import { Target } from "lucide-react";

import { methodSteps } from "@/features/home/data/home-content";

export function HomeMethodSection() {
  return (
    <section className="border-y border-white/10 bg-white/[0.025] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center gap-3">
          <Target className="text-[#7ed4e8]" size={24} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
              Como trabajamos
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              Del contexto al impacto.
            </h2>
          </div>
        </div>
        <div className="relative grid gap-4 md:grid-cols-5">
          <div
            className="flow-line absolute left-0 right-0 top-8 hidden h-px md:block"
            aria-hidden="true"
          />
          {methodSteps.map(([number, title, text]) => (
            <div
              key={number}
              className="relative rounded-lg border border-white/10 bg-[#071018] p-5"
            >
              <span className="flex size-12 items-center justify-center rounded-md border border-[#469eb4]/40 bg-[#469eb4]/10 text-sm font-semibold text-[#e1feff]">
                {number}
              </span>
              <h3 className="mt-5 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
