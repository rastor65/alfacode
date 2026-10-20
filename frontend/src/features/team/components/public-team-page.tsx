"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Mail,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

import { GithubIcon } from "@/components/icons/github-icon";
import { ButtonLink } from "@/components/ui/button-link";
import type { TeamMember } from "@/types/domain";
import { TeamEmptyState } from "./team-empty-state";

type PublicTeamPageProps = {
  members?: TeamMember[];
};

export function PublicTeamPage({ members = [] }: PublicTeamPageProps) {
  const [selectedRole, setSelectedRole] = useState<string>("ALL");

  if (!members || members.length === 0) {
    return <TeamEmptyState />;
  }

  const filteredMembers =
    selectedRole === "ALL"
      ? members
      : members.filter((m) => m.role === selectedRole);

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-[0.24em] text-cyan-200">
          <Users size={14} className="text-cyan-400" aria-hidden="true" />
          Comunidad Investigativa
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Equipo AlfaCode
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          Docentes, estudiantes e investigadores de la Universidad de La Guajira dedicados al desarrollo de software y la investigación aplicada.
        </p>
      </div>

      {/* Filtros por Rol */}
      <div className="mt-10 flex flex-wrap gap-2">
        {[
          { id: "ALL", label: "Todos los Integrantes" },
          { id: "LEADER", label: "Dirección" },
          { id: "STUDENT", label: "Estudiantes / Investigadores" },
        ].map((tab) => {
          const isActive = selectedRole === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedRole(tab.id)}
              className={`rounded-lg px-4 py-2 text-xs font-mono font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isActive
                  ? "border border-cyan-400/50 bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(70,158,180,0.25)]"
                  : "border border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid de Integrantes */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member, idx) => {
          const initials = member.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <article
              key={member.id}
              className={`scroll-reveal stagger-${(idx % 6) + 1} glass-card-interactive group relative flex flex-col justify-between rounded-xl p-6`}
            >
              <div>
                {/* Cabecera de la tarjeta: Avatar + Rol */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-14 items-center justify-center rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-950/80 to-slate-900/80 font-mono text-lg font-bold text-cyan-200 shadow-[0_0_15px_rgba(70,158,180,0.2)]">
                    {initials}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-950/40 px-2.5 py-0.5 text-[11px] font-mono text-cyan-200">
                    <span className="size-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
                    {member.roleLabel}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-bold text-white transition-colors group-hover:text-cyan-200">
                  {member.name}
                </h2>
                <p className="mt-1 text-xs font-mono text-cyan-300/80">
                  {member.focusArea}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {member.bio}
                </p>

                {/* Líneas de Investigación */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {member.researchLines.map((line) => (
                    <span
                      key={line}
                      className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-mono text-slate-300"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>

              {/* Acciones de Contacto */}
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                <div className="flex items-center gap-2">
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-slate-900/50 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-white"
                      aria-label={`GitHub de ${member.name}`}
                    >
                      <GithubIcon size={15} aria-hidden="true" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-slate-900/50 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-white"
                      aria-label={`Escribir a ${member.name}`}
                    >
                      <Mail size={15} aria-hidden="true" />
                    </a>
                  )}
                </div>

                <span className="text-[11px] font-mono text-emerald-400">
                  Investigación Activa
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Banner de Vinculacion */}
      <div className="scroll-reveal mt-16 rounded-xl border border-cyan-400/25 bg-gradient-to-r from-cyan-950/40 via-slate-950/60 to-cyan-950/30 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300">
              <Sparkles size={14} className="text-cyan-400" aria-hidden="true" />
              ¿Quieres unirte a AlfaCode?
            </span>
            <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Convocatoria permanente para estudiantes e investigadores
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Si perteneces a la Universidad de La Guajira y te interesa la arquitectura de software, la IA y los sistemas conectados, puedes solicitar vinculación activa al semillero.
            </p>
          </div>

          <ButtonLink href="/registro" variant="primary" className="gap-2 shrink-0">
            Postularse al Semillero
            <ArrowRight size={16} aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
