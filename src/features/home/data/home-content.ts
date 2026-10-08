import {
  BrainCircuit,
  Cpu,
  Database,
  FlaskConical,
  Layers3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Principle = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export const homeStats = [
  { label: "Proyectos iniciales", value: "5" },
  { label: "Lineas de investigacion", value: "04" },
  { label: "Publicacion de datos", value: "1 fuente" },
];

export const homePrinciples: Principle[] = [
  {
    icon: Database,
    title: "Gestionar una vez",
    text: "Los datos nacen en la plataforma interna y se reutilizan en el portal publico.",
  },
  {
    icon: BrainCircuit,
    title: "Investigar mientras se construye",
    text: "Cada proyecto conecta problema, tecnologia, metodologia, resultados e impacto.",
  },
  {
    icon: Cpu,
    title: "Software aplicable",
    text: "La prioridad es crear soluciones reales, mantenibles y medibles.",
  },
];

export const processSteps = [
  "Problema",
  "Investigacion",
  "Diseno",
  "Desarrollo",
  "IA / IoT",
  "Solucion",
  "Impacto",
];

export const methodSteps = [
  ["01", "Identificamos", "Analizamos una problematica real y su contexto."],
  ["02", "Investigamos", "Exploramos antecedentes, necesidades y oportunidades."],
  ["03", "Disenamos", "Definimos arquitectura, experiencia y estrategia tecnica."],
  ["04", "Desarrollamos", "Construimos prototipos y soluciones funcionales."],
  ["05", "Validamos", "Medimos resultados y convertimos hallazgos en conocimiento."],
] as const;

export const researchLineIcons = [Layers3, BrainCircuit, Cpu, FlaskConical];
