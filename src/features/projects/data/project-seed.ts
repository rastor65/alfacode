import type { Project, ResearchLine, Technology } from "@/types/domain";

export const researchLines: ResearchLine[] = [
  {
    id: "software",
    name: "Desarrollo de Software",
    slug: "desarrollo-de-software",
    description: "Arquitectura, productos digitales y soluciones web aplicadas.",
  },
  {
    id: "ai",
    name: "Inteligencia Artificial",
    slug: "inteligencia-artificial",
    description: "Modelos, LLM, agentes, analitica y automatizacion inteligente.",
  },
  {
    id: "iot",
    name: "IoT",
    slug: "iot",
    description: "Sensores, dispositivos conectados y monitoreo de variables reales.",
  },
  {
    id: "applied-research",
    name: "Investigacion Aplicada",
    slug: "investigacion-aplicada",
    description: "Soluciones verificables para problemas reales del entorno.",
  },
];

export const technologies: Technology[] = [
  { id: "react", name: "React", slug: "react", category: "Frontend" },
  { id: "nextjs", name: "Next.js", slug: "nextjs", category: "Frontend" },
  { id: "postgres", name: "PostgreSQL", slug: "postgresql", category: "Data" },
  { id: "llm", name: "LLM", slug: "llm", category: "AI" },
  { id: "mcp", name: "MCP", slug: "mcp", category: "AI" },
  { id: "esp32", name: "ESP32", slug: "esp32", category: "IoT" },
];

export const projects: Project[] = [
  {
    id: "wellness-monitoring",
    name: "Sistema de monitoreo inteligente para el bienestar fisico",
    slug: "monitoreo-inteligente-bienestar-fisico",
    summary:
      "Plataforma para capturar, analizar y visualizar senales asociadas al bienestar fisico.",
    problemStatement:
      "La toma de decisiones sobre bienestar requiere datos oportunos, trazables y comprensibles.",
    objective:
      "Integrar software, sensores y analitica para apoyar procesos de seguimiento fisico.",
    status: "RESEARCH",
    visibility: "PUBLIC",
    researchLines: [researchLines[1], researchLines[2], researchLines[3]],
    technologies: [technologies[2], technologies[3], technologies[5]],
  },
  {
    id: "hotel-management",
    name: "Sistema para la gestion de informacion de hoteles",
    slug: "gestion-informacion-hoteles",
    summary:
      "Solucion web para administrar informacion operativa, reservas y recursos hoteleros.",
    problemStatement:
      "La informacion hotelera fragmentada reduce eficiencia y trazabilidad operativa.",
    objective:
      "Centralizar procesos clave en una experiencia web clara, segura y responsiva.",
    status: "DEVELOPMENT",
    visibility: "PUBLIC",
    researchLines: [researchLines[0], researchLines[3]],
    technologies: [technologies[0], technologies[1], technologies[2]],
  },
  {
    id: "gamified-learning",
    name: "Plataforma educativa gamificada",
    slug: "plataforma-educativa-gamificada",
    summary:
      "Entorno educativo con dinamicas de progreso, retos y retroalimentacion para estudiantes.",
    problemStatement:
      "La baja motivacion limita la continuidad de procesos de aprendizaje autonomo.",
    objective:
      "Aplicar mecanicas de juego para mejorar participacion y seguimiento pedagogico.",
    status: "DESIGN",
    visibility: "PUBLIC",
    researchLines: [researchLines[0], researchLines[3]],
    technologies: [technologies[0], technologies[1]],
  },
  {
    id: "ai-learning-platform",
    name: "Plataforma educativa potenciada mediante IA, MCP y LLM",
    slug: "plataforma-educativa-ia-mcp-llm",
    summary:
      "Sistema educativo con capacidades de asistencia inteligente, contexto y herramientas conectadas.",
    problemStatement:
      "Los entornos educativos necesitan apoyo personalizado sin perder trazabilidad academica.",
    objective:
      "Explorar LLM y MCP para mejorar acompanamiento, evaluacion y acceso a recursos.",
    status: "RESEARCH",
    visibility: "PUBLIC",
    researchLines: [researchLines[1], researchLines[3]],
    technologies: [technologies[1], technologies[3], technologies[4]],
  },
  {
    id: "uniguajira-responsive-access",
    name: "Plataforma web responsiva para acceso multidispositivo",
    slug: "acceso-multidispositivo-software-avanzado-uniguajira",
    summary:
      "Interfaz responsiva para ampliar el acceso a software de manejo avanzado de la Universidad de La Guajira.",
    problemStatement:
      "El acceso limitado por dispositivo reduce disponibilidad y continuidad de uso.",
    objective:
      "Construir una experiencia web adaptable, accesible y eficiente para multiples pantallas.",
    status: "VALIDATION",
    visibility: "PUBLIC",
    researchLines: [researchLines[0], researchLines[3]],
    technologies: [technologies[0], technologies[1], technologies[2]],
  },
];
