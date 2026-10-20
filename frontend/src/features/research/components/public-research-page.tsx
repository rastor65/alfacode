import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Cpu,
  FlaskConical,
  GitBranch,
  Layers,
  Sparkles,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import type { ResearchLine } from "@/types/domain";

type PublicResearchPageProps = {
  researchLines: ResearchLine[];
};

export function PublicResearchPage({ researchLines }: PublicResearchPageProps) {
  const getLineIcon = (id: string) => {
    switch (id) {
      case "software":
        return Code2;
      case "ai":
        return BrainCircuit;
      case "iot":
        return Cpu;
      case "applied-research":
        return FlaskConical;
      default:
        return Layers;
    }
  };

  const getLineDetails = (id: string) => {
    switch (id) {
      case "software":
        return {
          scope:
            "Arquitecturas limpias, monolitos modulares y microservicios escalables para la web moderna.",
          technologies: ["Next.js", "NestJS", "TypeScript", "Clean Architecture"],
          focus: "Arquitectura de Software & Sistemas Distribuidos",
        };
      case "ai":
        return {
          scope:
            "Modelos de lenguaje (LLM), agentes inteligentes con MCP y analítica predictiva aplicada.",
          technologies: ["LLMs", "Model Context Protocol", "RAG", "Python"],
          focus: "Agentes Inteligentes & Machine Learning",
        };
      case "iot":
        return {
          scope:
            "Dispositivos conectados, microcontroladores ESP32 y telemetría en tiempo real.",
          technologies: ["ESP32", "MQTT", "WebSockets", "Telemetría"],
          focus: "Sensores, Edge Computing & Hardware Conectado",
        };
      case "applied-research":
        return {
          scope:
            "Soluciones de impacto territorial con evaluación empírica y código abierto.",
          technologies: ["Evaluación Empírica", "Open Source", "Transferencia I+D"],
          focus: "Innovación Tecnológica Territorial",
        };
      default:
        return {
          scope: "Investigación experimental en ciencias computacionales.",
          technologies: ["Software", "Datos"],
          focus: "Computación Avanzada",
        };
    }
  };

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-[0.24em] text-cyan-200">
          <GitBranch size={14} className="text-cyan-400" aria-hidden="true" />
          Foco Científico &amp; Aplicado
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Líneas de Investigación
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          Ejes estratégicos del semillero donde convergen computación avanzada, desarrollo de software y solución de necesidades territoriales.
        </p>
      </div>

      {/* Grid de Líneas de Investigación */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {researchLines.map((line, idx) => {
          const Icon = getLineIcon(line.id);
          const details = getLineDetails(line.id);

          return (
            <article
              key={line.id}
              className={`scroll-reveal stagger-${idx + 1} glass-card-interactive group relative flex flex-col justify-between rounded-xl p-7`}
            >
              <div>
                {/* Cabecera con icono neón */}
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-lg border border-cyan-400/35 bg-cyan-950/60 text-cyan-200 shadow-[0_0_22px_rgba(70,158,180,0.25)] transition-transform duration-300 group-hover:scale-105 group-hover:border-cyan-300">
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
                    Línea Activa
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-cyan-100">
                  {line.name}
                </h2>
                <p className="mt-1 font-mono text-xs text-cyan-300">
                  {details.focus}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {details.scope}
                </p>

                {/* Tecnologias Habilitadoras */}
                <div className="mt-6 border-t border-white/10 pt-5">
                  <span className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Tecnologías &amp; Enfoques Clave
                  </span>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {details.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-200"
                      >
                        <Sparkles size={11} className="text-cyan-400" aria-hidden="true" />
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botón hacia proyectos de la línea */}
              <div className="mt-6 pt-4">
                <Link
                  href={`/proyectos`}
                  className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-cyan-300 transition-colors hover:text-white"
                >
                  <span>Explorar Proyectos Asociados</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bloque Metodológico Institucional */}
      <div className="scroll-reveal mt-16 rounded-xl border border-cyan-400/20 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <h3 className="text-xl font-bold text-white sm:text-2xl">
          Marco de Investigación Experimental AlfaCode
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          En AlfaCode, cada línea de investigación se respalda con repositorios auditables, pruebas automatizadas y validación con usuarios reales.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="block text-xs font-bold text-white">Rigor Científico</span>
              <span className="block text-[11px] text-slate-400">Estado del arte con literatura indexada.</span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="block text-xs font-bold text-white">Arquitectura Robusta</span>
              <span className="block text-[11px] text-slate-400">Estándares de ingeniería y código limpio.</span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="block text-xs font-bold text-white">Transferencia Social</span>
              <span className="block text-[11px] text-slate-400">Soluciones desplegadas y medibles.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
