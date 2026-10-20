import {
  FolderGit2,
  GitBranch,
  Mail,
  Share2,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

import {
  type EmptyStateAction,
  type EmptyStateFeature,
  SectionEmptyState,
} from "@/components/ui/section-empty-state";

const teamFeatures: EmptyStateFeature[] = [
  {
    icon: UserCheck,
    title: "Integrantes & Investigadores",
    description:
      "Docentes líderes, investigadores principales, semilleristas activos y alumni de la Universidad de La Guajira.",
  },
  {
    icon: GitBranch,
    title: "Líneas & Responsables",
    description:
      "Asignación por áreas temáticas: Inteligencia Artificial, IoT, Desarrollo de Software e Investigación Aplicada.",
  },
  {
    icon: Share2,
    title: "Trazabilidad Académica",
    description:
      "Conexión con perfiles de MinCiencias CVLAC, identificador ORCID y repositorios de código en GitHub.",
  },
];

const teamActions: EmptyStateAction[] = [
  {
    label: "Postularse al Semillero",
    href: "/registro",
    variant: "primary",
    icon: Sparkles,
  },
  {
    label: "Ver Proyectos Activos",
    href: "/proyectos",
    variant: "secondary",
    icon: FolderGit2,
  },
  {
    label: "Contactar Coordinación",
    href: "/contacto",
    variant: "ghost",
    icon: Mail,
  },
];

export function TeamEmptyState() {
  return (
    <SectionEmptyState
      categoryLabel="Comunidad Investigativa"
      categoryIcon={Users}
      statusLabel="SINCRONIZACIÓN EN PREPARACIÓN"
      title="Equipo AlfaCode"
      moduleCode="SGPAI::MODULE::MEMBERS"
      description={
        <p>
          Este módulo se conectará a{" "}
          <code className="rounded border border-cyan-400/30 bg-cyan-950/70 px-2 py-0.5 font-mono text-sm font-semibold text-cyan-200">
            members
          </code>{" "}
          para publicar integrantes activos, alumni y responsables de líneas según visibilidad.
        </p>
      }
      features={teamFeatures}
      actions={teamActions}
    />
  );
}
