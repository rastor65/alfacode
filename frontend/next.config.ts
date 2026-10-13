import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Las vistas privadas viven bajo /hub (DEC-019); las rutas anteriores siguen funcionando.
  // Temporales (307) para no fijar en caches de navegador una estructura aun en evolucion.
  async redirects() {
    return [
      { source: "/panel", destination: "/hub", permanent: false },
      { source: "/perfil", destination: "/hub/perfil", permanent: false },
      { source: "/solicitudes", destination: "/hub/solicitudes", permanent: false },
      { source: "/integrantes", destination: "/hub/integrantes", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
