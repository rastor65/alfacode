import {
  Award,
  BookOpen,
  BrainCircuit,
  Cloud,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  Layers,
  Layers3,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Principle = {
  icon: LucideIcon;
  tag: string;
  title: string;
  text: string;
};

export type StatItem = {
  label: string;
  value: string;
  sublabel: string;
  icon: LucideIcon;
};

export type ProcessStage = {
  id: string;
  step: string;
  title: string;
  category: string;
  description: string;
  deliverable: string;
  techStack: string[];
  icon: LucideIcon;
};

export const homeStats: StatItem[] = [
  {
    label: "Proyectos en Desarrollo",
    value: "05+",
    sublabel: "Soluciones de software",
    icon: Code2,
  },
  {
    label: "Líneas de Investigación",
    value: "04",
    sublabel: "Áreas de enfoque",
    icon: GitBranch,
  },
  {
    label: "Portafolio Público",
    value: "100%",
    sublabel: "Experiencia navegable",
    icon: Sparkles,
  },
];

export const homePrinciples: Principle[] = [
  {
    icon: Database,
    tag: "01 / ARQUITECTURA",
    title: "Narrar con claridad",
    text: "Experiencia clara, rápida y consistente en el portafolio público.",
  },
  {
    icon: BrainCircuit,
    tag: "02 / METODOLOGÍA",
    title: "Investigar construyendo",
    text: "Metodología experimental, datos verificables e impacto medible.",
  },
  {
    icon: Cpu,
    tag: "03 / INGENIERÍA",
    title: "Software escalable",
    text: "Código limpio, pruebas rigurosas y despliegue continuo en la nube.",
  },
];

export const processSteps = [
  "Problema",
  "Investigación",
  "Diseño",
  "Desarrollo",
  "IA / IoT",
  "Solución",
  "Impacto",
];

export const detailedProcessSteps: ProcessStage[] = [
  {
    id: "01",
    step: "01",
    title: "Problema & Contexto",
    category: "Diagnóstico",
    description: "Detección de necesidades reales en la academia y la industria regional.",
    deliverable: "Formulación y requerimientos técnicos",
    techStack: ["Benchmark", "Alcance"],
    icon: Search,
  },
  {
    id: "02",
    step: "02",
    title: "Investigación & Estado del Arte",
    category: "Ciencia",
    description: "Revisión de literatura indexada y análisis de tecnologías emergentes.",
    deliverable: "Marco metodológico y viabilidad",
    techStack: ["IEEE / Scopus", "Viabilidad"],
    icon: BookOpen,
  },
  {
    id: "03",
    step: "03",
    title: "Diseño & Arquitectura",
    category: "Estructura",
    description: "Modelado de sistemas C4, diseño UI/UX y especificación de datos.",
    deliverable: "Arquitectura de software y UI",
    techStack: ["Clean Arch", "Figma"],
    icon: Layers,
  },
  {
    id: "04",
    step: "04",
    title: "Desarrollo & Prototipado",
    category: "Ingeniería",
    description: "Desarrollo iterativo tipado con pruebas rigurosas y código limpio.",
    deliverable: "MVP funcional y suite de pruebas",
    techStack: ["Next.js", "NestJS", "TypeScript"],
    icon: Code2,
  },
  {
    id: "05",
    step: "05",
    title: "Inteligencia Artificial & IoT",
    category: "Innovación",
    description: "Integración de agentes inteligentes LLM, MCP y telemetría IoT en borde.",
    deliverable: "Pipelines de inferencia y sensores",
    techStack: ["LLMs", "ESP32", "Edge"],
    icon: BrainCircuit,
  },
  {
    id: "06",
    step: "06",
    title: "Solución & Despliegue",
    category: "Producción",
    description: "Puesta en producción de alta disponibilidad con monitoreo y CI/CD.",
    deliverable: "Plataforma desplegada y auditada",
    techStack: ["Cloud", "Docker", "CI/CD"],
    icon: Cloud,
  },
  {
    id: "07",
    step: "07",
    title: "Impacto & Divulgación",
    category: "Publicación",
    description: "Divulgación científica en congresos, artículos y transferencia tecnológica.",
    deliverable: "Paper indexado y código abierto",
    techStack: ["Artículos", "Open Source"],
    icon: Share2,
  },
];

export const methodSteps = [
  ["01", "Identificamos", "Analizamos una problemática real, sus actores y su contexto operativo."],
  ["02", "Investigamos", "Exploramos antecedentes, literatura científica y oportunidades tecnológicas."],
  ["03", "Diseñamos", "Definimos arquitectura de software, experiencia UI/UX y modelo de datos."],
  ["04", "Desarrollamos", "Construimos prototipos, APIs y aplicaciones robustas de nivel profesional."],
  ["05", "Validamos", "Medimos métricas de rendimiento, publicamos hallazgos y transferimos conocimiento."],
] as const;

export const researchLineIcons = [Layers3, BrainCircuit, Cpu, FlaskConical];
