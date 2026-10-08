"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Terminal,
} from "lucide-react";

import { detailedProcessSteps, type ProcessStage } from "@/features/home/data/home-content";

export function HomeHeroPipeline() {
  const [activeStageId, setActiveStageId] = useState<string>("04");

  const currentStage: ProcessStage =
    detailedProcessSteps.find((s) => s.id === activeStageId) ??
    detailedProcessSteps[3];

  return (
    <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 lg:p-7">
      {/* Ambient background glow inside panel */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#469eb4]/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-[#7ed4e8]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Header bar */}
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-cyan-400" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7ed4e8]">
              Matriz de Ingeniería & I+D
            </p>
          </div>
          <h2 className="mt-1 text-base font-semibold text-white">
            Ciclo de Vida del Software AlfaCode
          </h2>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-200">
          <Terminal size={13} className="text-cyan-400" aria-hidden="true" />
          <span className="font-mono">TRL 4 - 7</span>
        </div>
      </div>

      {/* Interactive steps selector */}
      <div className="relative mb-6">
        <p className="mb-2.5 text-xs uppercase tracking-wider text-slate-400">
          Selecciona una fase para inspeccionar:
        </p>
        <div
          role="tablist"
          aria-label="Fases del ciclo de vida"
          className="grid grid-cols-7 gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1.5"
        >
          {detailedProcessSteps.map((stage) => {
            const isActive = stage.id === activeStageId;
            return (
              <button
                key={stage.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${stage.id}`}
                id={`tab-${stage.id}`}
                onClick={() => setActiveStageId(stage.id)}
                className={`group relative flex flex-col items-center justify-center rounded-lg py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? "bg-[#469eb4]/20 text-[#e1feff] shadow-[0_0_15px_rgba(70,158,180,0.25)] ring-1 ring-[#469eb4]/50"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="font-mono text-xs font-bold">{stage.step}</span>
                <span className="hidden truncate text-[10px] sm:inline-block max-w-[90%]">
                  {stage.title.split(" ")[0]}
                </span>
                {isActive && (
                  <span
                    className="absolute -bottom-1 size-1 rounded-full bg-cyan-400"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Phase Details Card */}
      <div
        id={`panel-${currentStage.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${currentStage.id}`}
        className="relative flex-1 rounded-xl border border-cyan-400/20 bg-slate-950/70 p-5 backdrop-blur-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-500/10 font-mono text-xs font-bold text-cyan-300">
              {currentStage.step}
            </span>
            <h3 className="text-base font-semibold text-white">
              {currentStage.title}
            </h3>
          </div>
          <span className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
            {currentStage.category}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          {currentStage.description}
        </p>

        {/* Deliverable info */}
        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-cyan-400"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Entregable principal
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-200">
                {currentStage.deliverable}
              </p>
            </div>
          </div>
        </div>

        {/* Tech stack chips */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 mr-1">
            Herramientas:
          </span>
          {currentStage.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Telemetry Footer Status */}
      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-emerald-400" aria-hidden="true" />
          <span>PostgreSQL + RLS · Next.js · Vercel</span>
        </div>
        <div className="flex items-center gap-1 text-cyan-300">
          <span>Semillero de Investigación</span>
          <ChevronRight size={13} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
