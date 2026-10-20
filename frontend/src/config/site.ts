export const siteConfig = {
  name: "AlfaCode",
  tagline: "Research & Software Lab",
  description:
    "Semillero de investigacion enfocado en desarrollo de software, inteligencia artificial, IoT e investigacion aplicada.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    github: "https://github.com/rastor65/alfacode",
    contact: "mailto:rdamianquintero@uniguajira.edu.co",
    email: "rdamianquintero@uniguajira.edu.co",
    institution: "Universidad de La Guajira",
  },
};

export const publicNavigation = [
  { href: "/proyectos", label: "Proyectos" },
  { href: "/investigacion", label: "Investigacion" },
  { href: "/equipo", label: "Equipo" },
  { href: "/publicaciones", label: "Publicaciones" },
  { href: "/contacto", label: "Contacto" },
];
