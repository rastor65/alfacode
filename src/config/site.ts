export const siteConfig = {
  name: "AlfaCode",
  tagline: "Research & Software Lab",
  description:
    "Semillero de investigacion enfocado en desarrollo de software, inteligencia artificial, IoT e investigacion aplicada.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    github: "https://github.com/",
    contact: "mailto:contacto@alfacode.dev",
  },
};

export const publicNavigation = [
  { href: "/proyectos", label: "Proyectos" },
  { href: "/investigacion", label: "Investigacion" },
  { href: "/equipo", label: "Equipo" },
  { href: "/publicaciones", label: "Publicaciones" },
  { href: "/contacto", label: "Contacto" },
];

export const appNavigation = [
  {
    href: "/app/dashboard",
    label: "Dashboard",
    permission: "dashboard.read",
    group: "Inicio",
  },
  {
    href: "/app/proyectos",
    label: "Proyectos",
    permission: "projects.read",
    group: "Gestion",
  },
  {
    href: "/app/integrantes",
    label: "Integrantes",
    permission: "members.read",
    group: "Gestion",
  },
  {
    href: "/app/investigacion",
    label: "Investigacion",
    permission: "research.read",
    group: "Gestion",
  },
  {
    href: "/app/tecnologias",
    label: "Tecnologias",
    permission: "technologies.read",
    group: "Gestion",
  },
  {
    href: "/app/publicaciones",
    label: "Publicaciones",
    permission: "publications.read",
    group: "Conocimiento",
  },
  {
    href: "/app/articulos",
    label: "Articulos",
    permission: "articles.read",
    group: "Conocimiento",
  },
  {
    href: "/app/eventos",
    label: "Eventos",
    permission: "events.read",
    group: "Comunidad",
  },
  {
    href: "/app/logros",
    label: "Logros",
    permission: "achievements.read",
    group: "Comunidad",
  },
  {
    href: "/app/convocatorias",
    label: "Convocatorias",
    permission: "calls.read",
    group: "Comunidad",
  },
  {
    href: "/app/solicitudes",
    label: "Solicitudes",
    permission: "applications.read",
    group: "Comunidad",
  },
  {
    href: "/app/aliados",
    label: "Aliados",
    permission: "partners.read",
    group: "Comunidad",
  },
  {
    href: "/app/multimedia",
    label: "Multimedia",
    permission: "media.read",
    group: "Sistema",
  },
  {
    href: "/app/sitio",
    label: "Sitio",
    permission: "site.read",
    group: "Sistema",
  },
  {
    href: "/app/auditoria",
    label: "Auditoria",
    permission: "audit.read",
    group: "Sistema",
  },
  {
    href: "/app/roles",
    label: "Roles y permisos",
    permission: "roles.read",
    group: "Sistema",
  },
  {
    href: "/app/usuarios",
    label: "Usuarios",
    permission: "users.read",
    group: "Sistema",
  },
  {
    href: "/app/configuracion",
    label: "Configuracion",
    permission: "site.manage",
    group: "Sistema",
  },
];
