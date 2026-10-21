"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Terminal,
} from "lucide-react";

import { detailedProcessSteps } from "@/features/home/data/home-content";
import {
  PhaseVisual01,
  PhaseVisual02,
  PhaseVisual03,
  PhaseVisual04,
  PhaseVisual05,
  PhaseVisual06,
  PhaseVisual07,
} from "./hero-pipeline-visuals";

const PHASE_VISUALS = [
  PhaseVisual01,
  PhaseVisual02,
  PhaseVisual03,
  PhaseVisual04,
  PhaseVisual05,
  PhaseVisual06,
  PhaseVisual07,
];

const AUTOPLAY_INTERVAL = 5500; // 5.5s por slide

export function HomeHeroPipeline() {
  const [activeIndex, setActiveIndex] = useState<number>(3); // Fase 04 por defecto
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const totalStages = detailedProcessSteps.length;

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalStages);
    setProgress(0);
  }, [totalStages]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalStages) % totalStages);
    setProgress(0);
  }, [totalStages]);

  const handleSelect = (idx: number) => {
    setActiveIndex(idx);
    setProgress(0);
  };

  // Autoplay timer con reinicio limpio al cambiar de fase
  useEffect(() => {
    if (!isPlaying || isHovered) return;

    const stepMs = 50;
    const increment = (stepMs / AUTOPLAY_INTERVAL) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [activeIndex, isPlaying, isHovered, handleNext]);

  return (
    <div
      className="glass-panel relative flex w-full min-w-0 max-w-full flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-7 shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Carrusel del Ciclo de Vida del Software AlfaCode"
    >
      {/* Ambient background glow inside panel */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#469eb4]/15 blur-3xl animate-parallax-float"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-[#7ed4e8]/10 blur-3xl animate-parallax-float-delayed"
        aria-hidden="true"
      />

      {/* Header bar con telemetría y controles del carrusel */}
      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-cyan-400" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-site-eyebrow">
              Matriz de Ingeniería &amp; I+D
            </p>
          </div>
          <h2 className="mt-1 text-base sm:text-lg font-bold tracking-tight text-white">
            Ciclo de Vida del Software AlfaCode
          </h2>
        </div>

        {/* Controles de reproducción y navegación */}
        <div className="flex items-center gap-2">
          {/* TRL Range Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-cyan-400/25 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-200 font-mono">
            <Terminal size={12} className="text-cyan-400" aria-hidden="true" />
            <span>TRL 4 - 7</span>
          </div>

          {/* Botones de navegación Anterior / Siguiente */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Fase anterior"
              className="flex size-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <ChevronLeft size={15} aria-hidden="true" />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pausar carrusel automático" : "Reanudar carrusel automático"}
              title={isPlaying ? "Pausar" : "Reanudar"}
              className="flex size-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-cyan-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {isPlaying ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Fase siguiente"
              className="flex size-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Selector de fases horizontal (01 a 07) */}
      <div className="relative mb-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="uppercase tracking-wider text-slate-400 font-mono text-[11px]">
            Explorar fases del pipeline:
          </span>
          <span className="font-mono text-cyan-300 text-[11px]">
            {String(activeIndex + 1).padStart(2, "0")} / {String(totalStages).padStart(2, "0")}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Fases del ciclo de vida"
          className="grid grid-cols-7 gap-1 sm:gap-1.5 rounded-xl border border-white/10 bg-black/50 p-1.5"
        >
          {detailedProcessSteps.map((stage, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={stage.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${stage.id}`}
                id={`tab-${stage.id}`}
                onClick={() => handleSelect(idx)}
                className={`group relative flex flex-col items-center justify-center rounded-lg py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? "bg-[#469eb4]/25 text-white shadow-[0_0_15px_rgba(70,158,180,0.3)] ring-1 ring-[#469eb4]/60"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className={`font-mono text-xs font-bold ${isActive ? "text-cyan-300" : "text-slate-400"}`}>
                  {stage.step}
                </span>
                <span className="hidden truncate text-[10px] sm:inline-block max-w-[90%] font-medium">
                  {stage.title.split(" ")[0]}
                </span>

                {/* Indicador de activo con punto cian */}
                {isActive && (
                  <span
                    className="absolute -bottom-1 size-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Barra de progreso de autoplay */}
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-cyan-400/80 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Contenedor Carrusel Horizontal (Enfoque puramente visual con diagramas vectoriales) */}
      <div className="relative w-full min-w-0 overflow-hidden rounded-xl border border-cyan-400/25 bg-slate-950/80 backdrop-blur-md">
        <div
          className="flex w-full transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {detailedProcessSteps.map((stage, idx) => {
            const Icon = stage.icon;
            const VisualComponent = PHASE_VISUALS[idx];

            return (
              <div
                key={stage.id}
                id={`panel-${stage.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${stage.id}`}
                className="w-full min-w-full max-w-full shrink-0 flex-none overflow-hidden flex flex-col p-4 sm:p-5"
              >
                {/* Header compacto de la fase: Icono, número, título y categoría */}
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        FASE {stage.step}
                      </span>
                      <span className="text-slate-600 text-xs font-mono">/</span>
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                        {stage.title}
                      </h3>
                    </div>
                  </div>

                  <span className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-cyan-300 uppercase tracking-wider font-mono">
                    {stage.category}
                  </span>
                </div>

                {/* Diagrama Visual Técnico Vectorial */}
                <div className="relative mt-3 flex items-center justify-center w-full min-h-[200px] sm:min-h-[225px] overflow-hidden rounded-lg border border-white/5 bg-slate-950/60 p-1 sm:p-2">
                  <VisualComponent />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telemetría y Barra de Estado Inferior */}
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-emerald-400 animate-pulse" aria-hidden="true" />
          <span className="font-mono text-[11px]">
            Next.js · React · Tailwind CSS
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-400">
            MODO: <span className={isPlaying ? "text-cyan-300" : "text-amber-300"}>{isPlaying ? "AUTO" : "PAUSA"}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-300">Semillero AlfaCode</span>
        </div>
      </div>
    </div>
  );
}
