"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Pause,
  Play,
  Sparkles,
  Target,
} from "lucide-react";

import { detailedProcessSteps } from "@/features/home/data/home-content";

export function HomeMethodCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalStages = detailedProcessSteps.length;

  const activeStage = detailedProcessSteps[activeIndex];
  const ActiveIcon = activeStage.icon;

  // Auto-play cada 5.5 segundos
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalStages);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalStages]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? totalStages - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalStages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    }
  };

  return (
    <section
      className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      aria-label="Ciclo de Vida del Software AlfaCode"
    >
      {/* Resplandor ambiental de fondo con deriva parallax */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[140px] animate-parallax-float"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Encabezado de seccion */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 py-1 pl-2.5 pr-3.5 text-xs font-mono font-semibold uppercase tracking-[0.24em] text-cyan-200">
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
              Matriz de Ingeniería &amp; I+D
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ciclo de Vida del Software AlfaCode
            </h2>
            <p className="mt-3 max-w-2xl text-base text-slate-300">
              De la identificación de problemas reales al despliegue, la analítica aplicada y la transferencia científica de impacto.
            </p>
          </div>

          {/* Controles del Carrusel (Anterior, Pausa/Play, Siguiente) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 transition-all duration-200 hover:border-cyan-400/50 hover:bg-cyan-950/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Fase anterior"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 transition-all duration-200 hover:border-cyan-400/50 hover:bg-cyan-950/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label={isPlaying ? "Pausar reproducción automática" : "Reanudar reproducción automática"}
              title={isPlaying ? "Pausar carrusel" : "Reanudar carrusel"}
            >
              {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 transition-all duration-200 hover:border-cyan-400/50 hover:bg-cyan-950/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Siguiente fase"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Barra de Pulsadores Interactivos (Fases 01 a 07) */}
        <div
          className="mt-10 flex gap-2 overflow-x-auto pb-4 pt-1 scrollbar-none sm:gap-3"
          role="tablist"
          aria-label="Pulsadores de fases del ciclo de vida"
          onKeyDown={handleKeyDown}
        >
          {detailedProcessSteps.map((stage, idx) => {
            const isActive = idx === activeIndex;
            const Icon = stage.icon;

            return (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`phase-panel-${stage.id}`}
                id={`phase-tab-${stage.id}`}
                onClick={() => {
                  setActiveIndex(idx);
                }}
                className={`group relative flex flex-1 min-w-[135px] flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? "border-cyan-400/60 bg-cyan-950/40 shadow-[0_0_25px_rgba(70,158,180,0.25)] ring-1 ring-cyan-400/30"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-cyan-500/30 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold transition-colors ${
                      isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {stage.step}
                  </span>
                  <span
                    className={`flex size-6 items-center justify-center rounded-lg border transition-all ${
                      isActive
                        ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
                        : "border-white/10 bg-slate-900/50 text-slate-400 group-hover:text-cyan-300"
                    }`}
                  >
                    <Icon size={12} aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-2.5">
                  <span
                    className={`block text-[11px] font-mono uppercase tracking-wider ${
                      isActive ? "text-cyan-200 font-semibold" : "text-slate-500 group-hover:text-slate-400"
                    }`}
                  >
                    {stage.category}
                  </span>
                  <span
                    className={`block text-xs font-semibold leading-tight line-clamp-1 transition-colors ${
                      isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {stage.title.split("&")[0].trim()}
                  </span>
                </div>

                {/* Barra de progreso animada de la fase activa */}
                {isActive && (
                  <div className="absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full bg-cyan-950/80">
                    <div
                      key={`progress-${activeIndex}`}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-300 shadow-[0_0_10px_#38bdf8] animate-stage-progress"
                      style={{ animationPlayState: isPlaying ? "running" : "paused" }}
                      aria-hidden="true"
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tarjeta Principal de la Fase Activa con Glassmorphism */}
        <div
          id={`phase-panel-${activeStage.id}`}
          role="tabpanel"
          aria-labelledby={`phase-tab-${activeStage.id}`}
          className="mt-6 rounded-xl border border-cyan-400/25 bg-slate-950/70 p-6 shadow-[0_0_50px_rgba(70,158,180,0.18)] backdrop-blur-2xl transition-all duration-300 sm:p-10"
        >
          <div
            key={activeStage.id}
            className="grid gap-8 lg:grid-cols-12 lg:items-center animate-stage-enter"
          >
            {/* Columna Izquierda: Detalle e Informacion */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-950/60 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-cyan-200 shadow-[0_0_12px_rgba(70,158,180,0.3)]">
                  <span className="size-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
                  Fase {activeStage.step} de {totalStages}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  Categoría: {activeStage.category}
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {activeStage.title}
              </h3>

              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                {activeStage.description}
              </p>

              {/* Sub-tarjeta Glassmorphic: Entregable Clave */}
              <div className="mt-6 rounded-lg border border-cyan-400/20 bg-cyan-950/30 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-500/20 text-cyan-200">
                    <CheckCircle2 size={16} aria-hidden="true" />
                  </div>
                  <div>
                    <span className="block font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Entregable de la Fase
                    </span>
                    <span className="mt-1 block text-sm font-medium text-slate-100">
                      {activeStage.deliverable}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pildoras de Tecnologias / Metodologias */}
              <div className="mt-6">
                <span className="block font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Herramientas &amp; Metodologías Clave
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeStage.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm"
                    >
                      <Sparkles size={12} className="text-cyan-400" aria-hidden="true" />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Nodo Visual Interactivo Glassmorphic con Energía Viva */}
            <div className="flex items-center justify-center lg:col-span-5">
              <div className="relative flex w-full max-w-sm flex-col items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-b from-cyan-950/40 via-slate-900/60 to-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
                {/* Anillo de pulso con icono y ondas de radar vivas */}
                <div className="relative flex size-24 items-center justify-center">
                  {/* Concentric live radar wave rings */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full border border-cyan-400/40 animate-radar-wave"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full border border-teal-400/30 animate-radar-wave-delayed"
                    aria-hidden="true"
                  />
                  <div className="relative flex size-20 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-950/80 p-5 shadow-[0_0_35px_rgba(70,158,180,0.45)] ring-1 ring-cyan-400/30">
                    <ActiveIcon className="size-full text-cyan-200 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-cyan-200">
                    <span className="size-1.5 rounded-full bg-cyan-300 animate-ping" aria-hidden="true" />
                    Estándar de Calidad AlfaCode
                  </div>
                  <h4 className="mt-2 text-lg font-bold text-white">
                    {activeStage.category} Riguroso
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    Trazabilidad científica y arquitectónica antes de avanzar al siguiente hito.
                  </p>
                </div>

                {/* Siguiente fase teaser */}
                <div className="mt-6 flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs">
                  <span className="text-slate-400">Siguiente Hito:</span>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1 font-semibold text-cyan-300 transition hover:text-white"
                  >
                    <span>Fase {detailedProcessSteps[(activeIndex + 1) % totalStages].step}</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
