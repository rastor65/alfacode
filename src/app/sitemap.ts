import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { projects } from "@/features/projects/data/project-seed";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/proyectos",
    "/investigacion",
    "/equipo",
    "/publicaciones",
    "/contacto",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
    })),
    ...projects.map((project) => ({
      url: `${siteConfig.url}/proyectos/${project.slug}`,
      lastModified: new Date(),
    })),
  ];
}
