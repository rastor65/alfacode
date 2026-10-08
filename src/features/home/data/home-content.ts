import {
  BrainCircuit,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  Layers3,
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
    label: "Datos Institucionales",
    value: "100%",
    sublabel: "Fuente única verídica",
    icon: Sparkles,
  },
];

export const homePrinciples: Principle[] = [
  {
    icon: Database,
    tag: "01 / ARQUITECTURA",
    title: "Gestionar una sola vez",
    text: "Los datos nacen en la plataforma interna y se reutilizan directamente en el portal público sin duplicidad.",
  },
  {
    icon: BrainCircuit,
    tag: "02 / METODOLOGÍA",
    title: "Investigar mientras se construye",
    text: "Cada proyecto articula problema, tecnología, estado del arte, metodología experimental e impacto medible.",
  },
  {
    icon: Cpu,
    tag: "03 / INGENIERÍA",
    title: "Software aplicable y escalable",
    text: "Priorizamos código limpio, arquitectura moderna, pruebas rigurosas y soluciones reales desplegadas en la nube.",
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
    description: "Identificación de necesidades reales en la industria, academia o comunidad.",
    deliverable: "Formulación del problema & Requerimientos clave",
    techStack: ["Benchmark", "Entrevistas", "Definición"],
  },
  {
    id: "02",
    step: "02",
    title: "Investigación & Estado del Arte",
    category: "Ciencia",
    description: "Revisión bibliográfica sistemática, papers científicos y análisis de tecnologías emergentes.",
    deliverable: "Marco metodológico & Matriz comparativa",
    techStack: ["IEEE / ACM", "Scopus", "Viabilidad"],
  },
  {
    id: "03",
    step: "03",
    title: "Diseño & Arquitectura",
    category: "Estructura",
    description: "Modelado de datos en PostgreSQL, patrones limpios y diseño de interfaz accesible.",
    deliverable: "Diagramas C4, UI/UX & Esquemas SQL",
    techStack: ["Clean Arch", "Figma", "DB Schema"],
  },
  {
    id: "04",
    step: "04",
    title: "Desarrollo & Prototipado",
    category: "Ingeniería",
    description: "Construcción iterativa con Next.js, TypeScript y altos estándares de calidad de software.",
    deliverable: "MVP Funcional & CI/CD automatizado",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    id: "05",
    step: "05",
    title: "Inteligencia Artificial & IoT",
    category: "Innovación",
    description: "Integración de modelos predictivos, agentes inteligentes o sensores de telemetría.",
    deliverable: "Pipelines de inferencia & Sensores en campo",
    techStack: ["LLMs", "Edge Computing", "Hardware"],
  },
  {
    id: "06",
    step: "06",
    title: "Solución & Despliegue",
    category: "Producción",
    description: "Puesta en marcha en entornos Cloud de alta disponibilidad con monitoreo en tiempo real.",
    deliverable: "Plataforma productiva en Vercel & Neon",
    techStack: ["Vercel", "Serverless SQL", "Blob Storage"],
  },
  {
    id: "07",
    step: "07",
    title: "Impacto & Divulgación",
    category: "Publicación",
    description: "Medición de resultados, redacción de artículos científicos y transferencia tecnológica.",
    deliverable: "Paper indexado, open-source & Transferencia",
    techStack: ["Artículos", "Convocatorias", "Comunidad"],
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
