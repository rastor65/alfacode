import type {
  Project,
  Publication,
  ResearchLine,
  TeamMember,
  Technology,
} from "@/types/domain";

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
  { id: "typescript", name: "TypeScript", slug: "typescript", category: "Language" },
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
    solution:
      "Sistema web con captura de datos, visualizacion historica y analitica aplicada.",
    status: "RESEARCH",
    visibility: "PUBLIC",
    trl: "TRL 3",
    developers: ["Jesus Monsalvo", "Robert Quintero"],
    researchLines: [researchLines[1], researchLines[2], researchLines[3]],
    technologies: [technologies[3], technologies[5], technologies[2]],
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
    solution:
      "Aplicacion administrativa conceptual con modulos de informacion y reportes operativos.",
    status: "DEVELOPMENT",
    visibility: "PUBLIC",
    liveUrl: "https://wayra-travel.com/",
    developers: ["Cristian Ramirez"],
    trl: "TRL 5",
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
    solution:
      "Plataforma con retos, progreso, logros, retroalimentacion y seguimiento docente.",
    status: "DESIGN",
    visibility: "PUBLIC",
    liveUrl: "https://edubid-unigua.up.railway.app/",
    developers: ["Juan Añez", "Ivan Martinez"],
    trl: "TRL 4",
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
    solution:
      "Asistente educativo conectado a herramientas y fuentes academicas controladas.",
    status: "RESEARCH",
    visibility: "PUBLIC",
    trl: "TRL 4",
    developers: ["Robert Quintero", "Ivan Martinez"],
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
    solution:
      "Frontend responsivo orientado a accesibilidad, rendimiento y compatibilidad multidispositivo.",
    status: "VALIDATION",
    visibility: "PUBLIC",
    trl: "TRL 6",
    developers: ["Cristian Ramirez", "Juan Añez"],
    researchLines: [researchLines[0], researchLines[3]],
    technologies: [technologies[0], technologies[1], technologies[2]],
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export const mockTeamMembers: TeamMember[] = [
  {
    id: "robert-quintero",
    name: "Robert Quintero",
    role: "LEADER",
    roleLabel: "Director del Semillero",
    bio: "Docente e investigador de la Universidad de La Guajira. Líder y director general de AlfaCode.",
    focusArea: "Dirección de I+D & Arquitectura de Software",
    researchLines: ["Desarrollo de Software", "Investigación Aplicada"],
    status: "ACTIVE",
    email: "rdamianquintero@uniguajira.edu.co",
    github: "https://github.com/rastor65",
  },
  {
    id: "cristian-ramirez",
    name: "Cristian Ramirez",
    role: "STUDENT",
    roleLabel: "Estudiante · Desarrollador",
    bio: "Ingeniería de Sistemas. Desarrollo web y arquitectura de interfaces.",
    focusArea: "Desarrollo Frontend & Sistemas Web",
    researchLines: ["Desarrollo de Software"],
    status: "ACTIVE",
  },
  {
    id: "jesus-monsalvo",
    name: "Jesus Monsalvo",
    role: "STUDENT",
    roleLabel: "Estudiante · Desarrollador",
    bio: "Ingeniería de Sistemas. Arquitectura de servicios y bases de datos.",
    focusArea: "Backend & Persistencia de Datos",
    researchLines: ["Desarrollo de Software"],
    status: "ACTIVE",
  },
  {
    id: "ivan-martinez",
    name: "Ivan Martinez",
    role: "STUDENT",
    roleLabel: "Estudiante · Investigador",
    bio: "Ingeniería de Sistemas. Modelos inteligentes e investigación aplicada.",
    focusArea: "Inteligencia Artificial & Software",
    researchLines: ["Inteligencia Artificial", "Desarrollo de Software"],
    status: "ACTIVE",
  },
  {
    id: "juan-anez",
    name: "Juan Añez",
    role: "STUDENT",
    roleLabel: "Estudiante · Investigador",
    bio: "Ingeniería de Sistemas. Dispositivos conectados y experimentación.",
    focusArea: "IoT & Sistemas Embebidos",
    researchLines: ["IoT", "Investigación Aplicada"],
    status: "ACTIVE",
  },
];

export const teamMembers: TeamMember[] = [];

export const mockPublications: Publication[] = [
  {
    id: "pub-01",
    title:
      "Arquitectura de Software y Sistemas Distribuidos para el Monitoreo de Parámetros Fisiológicos en Entornos Educativos",
    authors: ["R. Damian Quintero", "Equipo AlfaCode"],
    year: 2025,
    type: "ARTICLE",
    typeLabel: "Artículo Científico",
    venue: "Revista Colombiana de Tecnologías de Información (RCTI)",
    abstract:
      "Se describe el diseño, prototipado y validación de una plataforma web modular con soporte para captura continua de señales fisiológicas, procesamiento en borde y visualización analítica.",
    tags: ["Arquitectura de Software", "IoT", "Salud Digital"],
    url: "https://github.com/rastor65/alfacode",
  },
  {
    id: "pub-02",
    title:
      "Integración de Modelos de Lenguaje (LLM) y Agentes Contextuales en Entornos Universitarios de Aprendizaje",
    authors: ["R. Damian Quintero", "Investigadores AlfaCode"],
    year: 2026,
    type: "CONFERENCE",
    typeLabel: "Ponencia en Congreso",
    venue: "Congreso Internacional de Computación y Sistemas Aplicados (CICSA 2026)",
    abstract:
      "Evaluación empírica del impacto de asistentes educativos basados en el protocolo MCP para la tutoría guiada en cursos de ingeniería y ciencias exactas.",
    tags: ["Inteligencia Artificial", "LLM", "Educación"],
    url: "https://github.com/rastor65/alfacode",
  },
  {
    id: "pub-03",
    title:
      "Plataforma AlfaCode HUB: Sistema de Gestión de Proyectos y Actividades Investigativas (SGPAI)",
    authors: ["Semillero AlfaCode", "Universidad de La Guajira"],
    year: 2026,
    type: "SOFTWARE_REGISTRY",
    typeLabel: "Registro de Soporte Lógico",
    venue: "Dirección Nacional de Derecho de Autor (DNDA) - En trámite",
    abstract:
      "Monolito modular con backend en NestJS y frontend en Next.js diseñado para articular la producción científica, la gobernanza de proyectos y la trazabilidad de integrantes del semillero.",
    tags: ["Gestión I+D", "Open Source", "Software Universitario"],
    url: "https://github.com/rastor65/alfacode",
  },
  {
    id: "pub-04",
    title:
      "Diseño e Implementación de Experiencias WebAR con Glassmorphism para la Divulgación Académica",
    authors: ["Investigadores AlfaCode"],
    year: 2025,
    type: "TECHNICAL_REPORT",
    typeLabel: "Reporte Técnico de I+D",
    venue: "Universidad de La Guajira - Serie Técnica AlfaCode",
    abstract:
      "Lineamientos de diseño visual, optimización de renderizado 3D en navegadores móviles y accesibilidad para aplicaciones educativas interactivas.",
    tags: ["WebAR", "Three.js", "UI/UX"],
    url: "https://github.com/rastor65/alfacode",
  },
];

export const publications: Publication[] = [];

