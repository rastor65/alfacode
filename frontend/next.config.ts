import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // La prueba E2E compila en su propia carpeta (con el proxy hacia su backend temporal) para no
  // tocar la compilacion normal ni enviar peticiones al backend de quien desarrolla.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // El proxy `/api/v1` corta los cuerpos a 10 MB por defecto; los documentos admiten 20 MiB
    // (F3-07) mas la envoltura multipart. El backend aplica el limite real.
    proxyClientMaxBodySize: "21mb",
  },
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
