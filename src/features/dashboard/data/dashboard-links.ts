import { Database, FileText, FolderKanban, Users } from "lucide-react";

export const dashboardQuickLinks = [
  { icon: FolderKanban, label: "Proyectos", href: "/app/proyectos" },
  { icon: Users, label: "Integrantes", href: "/app/integrantes" },
  { icon: FileText, label: "Publicaciones", href: "/app/publicaciones" },
  { icon: Database, label: "Modelo de datos", href: "/app/configuracion" },
];
