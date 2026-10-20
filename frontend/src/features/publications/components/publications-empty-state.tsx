import {
  Award,
  BookOpen,
  Code2,
  Compass,
  FileText,
  FolderGit2,
  Mail,
} from "lucide-react";

import {
  type EmptyStateAction,
  type EmptyStateFeature,
  SectionEmptyState,
} from "@/components/ui/section-empty-state";

const publicationFeatures: EmptyStateFeature[] = [
  {
    icon: FileText,
    title: "Artículos en Revistas Indexadas",
    description:
      "Publicaciones científicas arbitradas por pares en revistas nacionales e internacionales (Publindex, Scopus, SciELO).",
  },
  {
    icon: Award,
    title: "Ponencias & Congresos",
    description:
      "Memorias técnicas, presentaciones orales y divulgación académica en encuentros científicos y tecnológicos.",
  },
  {
    icon: Code2,
    title: "Registros de Software (DNDA)",
    description:
      "Depósito legal de propiedad intelectual y soportes lógicos desarrollados en los proyectos del semillero.",
  },
];

const publicationActions: EmptyStateAction[] = [
  {
    label: "Líneas de Investigación",
    href: "/investigacion",
    variant: "primary",
    icon: Compass,
  },
  {
    label: "Ver Proyectos Activos",
    href: "/proyectos",
    variant: "secondary",
    icon: FolderGit2,
  },
  {
    label: "Contactar al Laboratorio",
    href: "/contacto",
    variant: "ghost",
    icon: Mail,
  },
];

export function PublicationsEmptyState() {
  return (
    <SectionEmptyState
      categoryLabel="Producción Científica & Técnica"
      categoryIcon={BookOpen}
      statusLabel="INDEXACIÓN EN PREPARACIÓN"
      title="Publicaciones"
      moduleCode="SGPAI::MODULE::PUBLICATIONS"
      description={
        <p>
          La producción académica se gestionará desde{" "}
          <code className="rounded border border-cyan-400/30 bg-cyan-950/70 px-2 py-0.5 font-mono text-sm font-semibold text-cyan-200">
            publications
          </code>{" "}
          y sus autores relacionados, separada de los artículos editoriales.
        </p>
      }
      features={publicationFeatures}
      actions={publicationActions}
    />
  );
}
