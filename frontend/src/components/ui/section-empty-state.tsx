import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ButtonLink } from "@/components/ui/button-link";
import type { ButtonVariant } from "@/components/ui/button-styles";

export type EmptyStateFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type EmptyStateAction = {
  label: string;
  href: string;
  variant?: ButtonVariant;
  icon?: LucideIcon;
};

export type SectionEmptyStateProps = {
  categoryLabel: string;
  categoryIcon: LucideIcon;
  statusLabel?: string;
  title: string;
  description: ReactNode;
  moduleCode: string;
  features?: EmptyStateFeature[];
  actions?: EmptyStateAction[];
  className?: string;
};

/**
 * Componente EmptyState oficial para secciones públicas en preparación / sincronización.
 * Presenta el isotipo vectorizado oficial de AlfaCode con anillos de radar cibernéticos,
 * insignias HUD de trazabilidad técnica, pilares de arquitectura y acciones rápidas.
 */
export function SectionEmptyState({
  categoryLabel,
  categoryIcon: CategoryIcon,
  statusLabel = "MÓDULO EN SINCRONIZACIÓN",
  title,
  description,
  moduleCode,
  features,
  actions,
  className = "",
}: SectionEmptyStateProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-4xl px-4 py-8 text-center sm:py-12 ${className}`}
    >
      {/* Resplandor ambiental de fondo */}
      <div
        className="pointer-events-none absolute left-1/2 top-16 size-[320px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px] sm:size-[420px]"
        aria-hidden="true"
      />

      {/* Contenedor central del Isotipo Vectorizado flotante (sin caja cuadrada) */}
      <div className="relative mx-auto flex size-28 items-center justify-center sm:size-32">
        {/* Anillos de onda de radar animados */}
        <div
          className="pointer-events-none absolute inset-0 -m-3 rounded-full border border-cyan-400/30 animate-radar-wave"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 -m-7 rounded-full border border-cyan-400/20 animate-radar-wave-delayed"
          aria-hidden="true"
        />

        {/* Resplandor suave detrás del isotipo */}
        <div
          className="pointer-events-none absolute -inset-3 rounded-full bg-cyan-400/20 blur-2xl animate-pulse"
          aria-hidden="true"
        />

        {/* Isotipo vectorizado de AlfaCode libre, con presencia y animación */}
        <AlfaCodeSymbol className="relative z-10 size-20 sm:size-24 drop-shadow-[0_0_24px_rgba(34,211,238,0.4)] transition-transform duration-500 hover:scale-110" />
      </div>

      {/* Badges de Trazabilidad y Estado con alto contraste para modo claro y oscuro */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-300 shadow-sm">
          <CategoryIcon size={14} className="text-cyan-400" aria-hidden="true" />
          {categoryLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-3 py-1 text-xs font-mono font-bold text-emerald-300 shadow-sm">
          <span
            className="size-1.5 animate-pulse rounded-full bg-emerald-400"
            aria-hidden="true"
          />
          {statusLabel}
        </span>
      </div>

      {/* Título de la Sección */}
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h1>

      {/* Descripción técnica de la sección con resalte de módulo */}
      <div className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
        {description}
      </div>

      {/* Tarjetas de Arquitectura / Capacidades Planificadas */}
      {features && features.length > 0 && (
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          {features.map((feature, idx) => {
            const FeatureIcon = feature.icon;
            return (
              <div
                key={idx}
                className="glass-card-interactive group relative rounded-xl p-5"
              >
                <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                  <FeatureIcon size={18} aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white transition-colors group-hover:text-cyan-200">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra de Acciones / Enlaces de Navegación */}
      {actions && actions.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {actions.map((act, idx) => {
            const ActionIcon = act.icon;
            return (
              <ButtonLink
                key={idx}
                href={act.href}
                variant={act.variant ?? "secondary"}
                className="gap-2"
              >
                {ActionIcon && <ActionIcon size={16} aria-hidden="true" />}
                <span>{act.label}</span>
              </ButtonLink>
            );
          })}
        </div>
      )}

      {/* Pie de Firma Técnica */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
        <span>{moduleCode}</span>
        <span>·</span>
        <span>Universidad de La Guajira</span>
        <span>·</span>
        <span>AlfaCode Research &amp; Software Lab</span>
      </div>
    </div>
  );
}
