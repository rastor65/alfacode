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
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/proyectos", label: "Proyectos" },
  { href: "/app/integrantes", label: "Integrantes" },
  { href: "/app/investigacion", label: "Investigacion" },
  { href: "/app/multimedia", label: "Multimedia" },
  { href: "/app/configuracion", label: "Configuracion" },
];
