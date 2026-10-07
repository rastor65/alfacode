import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getPublicProjectSlugs } from "@/features/projects/services/project-repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projectSlugs = await getPublicProjectSlugs();
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
    ...projectSlugs.map((slug) => ({
      url: `${siteConfig.url}/proyectos/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
