import { config } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const root = process.cwd();
const envLocal = path.join(root, ".env.local");
const envFallback = path.join(root, ".env");

if (existsSync(envLocal)) {
  config({ path: envLocal });
} else if (existsSync(envFallback)) {
  config({ path: envFallback });
} else {
  config();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Add it to .env.local first.");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: "require",
});

const permissions = [
  ["dashboard.read", "dashboard", "Consultar dashboard interno"],

  ["projects.read", "projects", "Consultar proyectos internos permitidos"],
  ["projects.create", "projects", "Crear proyectos"],
  ["projects.update", "projects", "Actualizar proyectos"],
  ["projects.delete", "projects", "Eliminar o archivar proyectos"],
  ["projects.publish", "projects", "Publicar proyectos"],
  ["project_members.manage", "projects", "Gestionar integrantes por proyecto"],
  ["project_milestones.manage", "projects", "Gestionar hitos de proyecto"],
  ["project_resources.manage", "projects", "Gestionar recursos de proyecto"],

  ["members.read", "members", "Consultar integrantes"],
  ["members.create", "members", "Crear integrantes"],
  ["members.update", "members", "Actualizar integrantes"],
  ["members.delete", "members", "Eliminar o archivar integrantes"],
  ["members.manage", "members", "Gestionar integrantes"],

  ["research.read", "research", "Consultar lineas de investigacion"],
  ["research.create", "research", "Crear lineas de investigacion"],
  ["research.update", "research", "Actualizar lineas de investigacion"],
  ["research.delete", "research", "Eliminar o archivar lineas de investigacion"],
  ["research.manage", "research", "Gestionar lineas de investigacion"],

  ["technologies.read", "technologies", "Consultar tecnologias"],
  ["technologies.create", "technologies", "Crear tecnologias"],
  ["technologies.update", "technologies", "Actualizar tecnologias"],
  ["technologies.delete", "technologies", "Eliminar o archivar tecnologias"],
  ["technologies.manage", "technologies", "Gestionar tecnologias"],

  ["articles.read", "articles", "Consultar articulos internos"],
  ["articles.create", "articles", "Crear articulos"],
  ["articles.update", "articles", "Actualizar articulos"],
  ["articles.delete", "articles", "Eliminar o archivar articulos"],
  ["articles.review", "articles", "Revisar articulos"],
  ["articles.publish", "articles", "Publicar articulos"],
  ["articles.manage", "articles", "Gestionar articulos"],

  ["publications.read", "publications", "Consultar publicaciones internas"],
  ["publications.create", "publications", "Crear publicaciones"],
  ["publications.update", "publications", "Actualizar publicaciones"],
  ["publications.delete", "publications", "Eliminar o archivar publicaciones"],
  ["publications.publish", "publications", "Publicar publicaciones"],
  ["publications.manage", "publications", "Gestionar publicaciones"],

  ["events.read", "events", "Consultar eventos internos"],
  ["events.create", "events", "Crear eventos"],
  ["events.update", "events", "Actualizar eventos"],
  ["events.delete", "events", "Eliminar o archivar eventos"],
  ["events.publish", "events", "Publicar eventos"],
  ["events.manage", "events", "Gestionar eventos"],

  ["achievements.read", "achievements", "Consultar logros internos"],
  ["achievements.create", "achievements", "Crear logros"],
  ["achievements.update", "achievements", "Actualizar logros"],
  ["achievements.delete", "achievements", "Eliminar o archivar logros"],
  ["achievements.publish", "achievements", "Publicar logros"],
  ["achievements.manage", "achievements", "Gestionar logros"],

  ["calls.read", "calls", "Consultar convocatorias internas"],
  ["calls.create", "calls", "Crear convocatorias"],
  ["calls.update", "calls", "Actualizar convocatorias"],
  ["calls.delete", "calls", "Eliminar o archivar convocatorias"],
  ["calls.publish", "calls", "Publicar convocatorias"],
  ["calls.manage", "calls", "Gestionar convocatorias"],

  ["applications.read", "applications", "Consultar solicitudes"],
  ["applications.update", "applications", "Actualizar solicitudes"],
  ["applications.review", "applications", "Revisar solicitudes"],
  ["applications.delete", "applications", "Eliminar solicitudes"],
  ["applications.manage", "applications", "Gestionar solicitudes"],

  ["partners.read", "partners", "Consultar aliados internos"],
  ["partners.create", "partners", "Crear aliados"],
  ["partners.update", "partners", "Actualizar aliados"],
  ["partners.delete", "partners", "Eliminar o archivar aliados"],
  ["partners.publish", "partners", "Publicar aliados"],
  ["partners.manage", "partners", "Gestionar aliados"],

  ["media.read", "media", "Consultar multimedia interna"],
  ["media.upload", "media", "Subir archivos"],
  ["media.update", "media", "Actualizar metadatos de multimedia"],
  ["media.delete", "media", "Eliminar multimedia"],
  ["media.manage", "media", "Gestionar multimedia"],

  ["site.read", "site", "Consultar configuracion del sitio"],
  ["site.update", "site", "Actualizar contenidos del sitio"],
  ["site.manage", "site", "Gestionar contenidos del sitio"],

  ["audit.read", "audit", "Consultar auditoria"],

  ["roles.read", "roles", "Consultar roles y permisos"],
  ["roles.manage", "roles", "Gestionar roles y permisos"],
  ["users.read", "users", "Consultar usuarios"],
  ["users.manage", "users", "Gestionar usuarios"],
];

const readOnlyPermissions = [
  "dashboard.read",
  "projects.read",
  "members.read",
  "research.read",
  "technologies.read",
  "articles.read",
  "publications.read",
  "events.read",
  "achievements.read",
  "calls.read",
  "partners.read",
  "media.read",
  "site.read",
];

const roles = [
  {
    key: "semillerista",
    name: "Semillerista",
    description: "Integrante autenticado con lectura interna basica.",
    permissions: readOnlyPermissions,
  },
  {
    key: "lider_proyecto",
    name: "Lider de proyecto",
    description: "Gestiona proyectos donde tiene liderazgo asignado.",
    permissions: [
      ...readOnlyPermissions,
      "projects.create",
      "projects.update",
      "project_members.manage",
      "project_milestones.manage",
      "project_resources.manage",
      "media.upload",
      "media.update",
    ],
  },
  {
    key: "docente_investigador",
    name: "Docente / investigador",
    description: "Acompana investigacion, proyectos y publicaciones.",
    permissions: [
      ...readOnlyPermissions,
      "projects.update",
      "project_milestones.manage",
      "project_resources.manage",
      "research.update",
      "articles.review",
      "publications.create",
      "publications.update",
      "publications.manage",
      "media.upload",
    ],
  },
  {
    key: "editor",
    name: "Editor",
    description: "Gestiona contenido editorial y publicaciones web.",
    permissions: [
      ...readOnlyPermissions,
      "articles.create",
      "articles.update",
      "articles.delete",
      "articles.review",
      "articles.publish",
      "articles.manage",
      "media.upload",
      "media.update",
      "media.manage",
    ],
  },
  {
    key: "coordinador",
    name: "Coordinador",
    description: "Gestiona la operacion general del semillero.",
    permissions: [
      ...readOnlyPermissions,
      "projects.read",
      "projects.create",
      "projects.update",
      "projects.delete",
      "projects.publish",
      "project_members.manage",
      "project_milestones.manage",
      "project_resources.manage",
      "members.manage",
      "members.create",
      "members.update",
      "members.delete",
      "research.manage",
      "research.create",
      "research.update",
      "research.delete",
      "technologies.manage",
      "technologies.create",
      "technologies.update",
      "technologies.delete",
      "publications.manage",
      "publications.create",
      "publications.update",
      "publications.delete",
      "publications.publish",
      "events.manage",
      "events.create",
      "events.update",
      "events.delete",
      "events.publish",
      "achievements.manage",
      "achievements.create",
      "achievements.update",
      "achievements.delete",
      "achievements.publish",
      "calls.manage",
      "calls.create",
      "calls.update",
      "calls.delete",
      "calls.publish",
      "applications.read",
      "applications.update",
      "applications.review",
      "applications.manage",
      "partners.manage",
      "partners.create",
      "partners.update",
      "partners.delete",
      "partners.publish",
      "media.upload",
      "media.update",
      "media.delete",
      "media.manage",
      "site.update",
      "site.manage",
      "audit.read",
    ],
  },
  {
    key: "administrador",
    name: "Administrador",
    description: "Acceso completo a configuracion, usuarios y permisos.",
    permissions: permissions.map(([key]) => key),
  },
];

const researchLines = [
  {
    name: "Desarrollo de Software",
    slug: "desarrollo-de-software",
    description: "Arquitectura, productos digitales y soluciones web aplicadas.",
    iconKey: "code",
  },
  {
    name: "Inteligencia Artificial",
    slug: "inteligencia-artificial",
    description: "Modelos, LLM, agentes, analitica y automatizacion inteligente.",
    iconKey: "brain",
  },
  {
    name: "IoT",
    slug: "iot",
    description: "Sensores, dispositivos conectados y monitoreo de variables reales.",
    iconKey: "cpu",
  },
  {
    name: "Investigacion Aplicada",
    slug: "investigacion-aplicada",
    description: "Soluciones verificables para problemas reales del entorno.",
    iconKey: "flask",
  },
];

const technologies = [
  ["React", "react", "Frontend"],
  ["Next.js", "nextjs", "Frontend"],
  ["TypeScript", "typescript", "Frontend"],
  ["Tailwind CSS", "tailwind-css", "Frontend"],
  ["PostgreSQL", "postgresql", "Data"],
  ["Vercel", "vercel", "Platform"],
  ["Vercel Blob", "vercel-blob", "Storage"],
  ["Python", "python", "Backend/Data"],
  ["Arduino", "arduino", "IoT"],
  ["ESP32", "esp32", "IoT"],
  ["TensorFlow", "tensorflow", "AI"],
  ["LLM", "llm", "AI"],
  ["MCP", "mcp", "AI"],
];

const projects = [
  {
    name: "Sistema de monitoreo inteligente para el bienestar fisico",
    slug: "monitoreo-inteligente-bienestar-fisico",
    summary:
      "Plataforma para capturar, analizar y visualizar senales asociadas al bienestar fisico.",
    problemStatement:
      "La toma de decisiones sobre bienestar requiere datos oportunos, trazables y comprensibles.",
    objective:
      "Integrar software, sensores y analitica para apoyar procesos de seguimiento fisico.",
    solution:
      "Sistema web con captura de datos, almacenamiento historico, visualizacion y analitica.",
    status: "RESEARCH",
    visibility: "PUBLIC",
    researchLineSlugs: ["inteligencia-artificial", "iot", "investigacion-aplicada"],
    technologySlugs: ["postgresql", "esp32", "llm"],
  },
  {
    name: "Sistema para la gestion de informacion de hoteles",
    slug: "gestion-informacion-hoteles",
    summary:
      "Solucion web para administrar informacion operativa, reservas y recursos hoteleros.",
    problemStatement:
      "La informacion hotelera fragmentada reduce eficiencia y trazabilidad operativa.",
    objective:
      "Centralizar procesos clave en una experiencia web clara, segura y responsiva.",
    solution:
      "Aplicacion web administrativa con modulos de informacion, roles y reportes operativos.",
    status: "DEVELOPMENT",
    visibility: "PUBLIC",
    researchLineSlugs: ["desarrollo-de-software", "investigacion-aplicada"],
    technologySlugs: ["react", "nextjs", "postgresql"],
  },
  {
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
    researchLineSlugs: ["desarrollo-de-software", "investigacion-aplicada"],
    technologySlugs: ["react", "nextjs", "typescript"],
  },
  {
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
    researchLineSlugs: ["inteligencia-artificial", "investigacion-aplicada"],
    technologySlugs: ["nextjs", "llm", "mcp"],
  },
  {
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
    researchLineSlugs: ["desarrollo-de-software", "investigacion-aplicada"],
    technologySlugs: ["react", "nextjs", "tailwind-css"],
  },
];

try {
  await sql.begin(async (tx) => {
    for (const [key, module, description] of permissions) {
      await tx`
        insert into permissions (key, module, description)
        values (${key}, ${module}, ${description})
        on conflict (key) do update set
          module = excluded.module,
          description = excluded.description
      `;
    }

    for (const role of roles) {
      const [createdRole] = await tx`
        insert into roles (name, key, description, is_system)
        values (${role.name}, ${role.key}, ${role.description}, true)
        on conflict (key) do update set
          name = excluded.name,
          description = excluded.description,
          is_system = excluded.is_system
        returning id
      `;

      await tx`
        delete from role_permissions
        where role_id = ${createdRole.id}
          and permission_id not in (
            select id from permissions where key = any(${role.permissions})
          )
      `;

      for (const permissionKey of role.permissions) {
        const [permission] = await tx`
          select id from permissions where key = ${permissionKey}
        `;

        await tx`
          insert into role_permissions (role_id, permission_id)
          values (${createdRole.id}, ${permission.id})
          on conflict do nothing
        `;
      }
    }

    for (const line of researchLines) {
      await tx`
        insert into research_lines (name, slug, description, icon_key, status, visibility)
        values (${line.name}, ${line.slug}, ${line.description}, ${line.iconKey}, 'ACTIVE', 'PUBLIC')
        on conflict (slug) do update set
          name = excluded.name,
          description = excluded.description,
          icon_key = excluded.icon_key,
          status = excluded.status,
          visibility = excluded.visibility
      `;
    }

    for (const [name, slug, category] of technologies) {
      await tx`
        insert into technologies (name, slug, category, status)
        values (${name}, ${slug}, ${category}, 'ACTIVE')
        on conflict (slug) do update set
          name = excluded.name,
          category = excluded.category,
          status = excluded.status
      `;
    }

    for (const project of projects) {
      const [createdProject] = await tx`
        insert into projects (
          name,
          slug,
          summary,
          problem_statement,
          objective,
          solution,
          status,
          visibility,
          published_at
        )
        values (
          ${project.name},
          ${project.slug},
          ${project.summary},
          ${project.problemStatement},
          ${project.objective},
          ${project.solution},
          ${project.status},
          ${project.visibility},
          now()
        )
        on conflict (slug) do update set
          name = excluded.name,
          summary = excluded.summary,
          problem_statement = excluded.problem_statement,
          objective = excluded.objective,
          solution = excluded.solution,
          status = excluded.status,
          visibility = excluded.visibility,
          published_at = excluded.published_at
        returning id
      `;

      for (const lineSlug of project.researchLineSlugs) {
        const [line] = await tx`
          select id from research_lines where slug = ${lineSlug}
        `;

        await tx`
          insert into project_research_lines (project_id, research_line_id)
          values (${createdProject.id}, ${line.id})
          on conflict do nothing
        `;
      }

      for (const technologySlug of project.technologySlugs) {
        const [technology] = await tx`
          select id from technologies where slug = ${technologySlug}
        `;

        await tx`
          insert into project_technologies (project_id, technology_id)
          values (${createdProject.id}, ${technology.id})
          on conflict do nothing
        `;
      }
    }

    await tx`
      insert into site_settings (key, value, visibility)
      values (
        'home.hero',
        ${JSON.stringify({
          eyebrow: "Research & Software Lab",
          title: "AlfaCode gestiona conocimiento, proyectos e investigacion aplicada.",
          description:
            "Una plataforma institucional para administrar el semillero y publicar automaticamente sus proyectos, integrantes, publicaciones, eventos y logros desde una unica fuente de datos.",
        })}::jsonb,
        'PUBLIC'
      )
      on conflict (key) do update set
        value = excluded.value,
        visibility = excluded.visibility,
        updated_at = now()
    `;
  });

  console.log("Database seed completed successfully.");
} catch (error) {
  console.error("Database seed failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
