// Servidor personalizado de Next.js: es el unico punto donde se conoce el socket real del
// cliente. Sanea X-Forwarded-For antes de que el rewrite de /api/v1 llegue al backend
// (DEC-006). Uso: `node server/index.mjs --dev` en desarrollo, sin flag en produccion.
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { applyClientIpHeaders, parseTrustedHops } from "./client-ip.mjs";

const dev = process.argv.includes("--dev");
process.env.NODE_ENV ??= dev ? "development" : "production";

const { default: next } = await import("next");

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 3000);
const host = process.env.FRONTEND_HOST || undefined;
const trustedHops = parseTrustedHops(process.env.FRONTEND_TRUSTED_PROXY_HOPS);

const httpServer = createServer();

// Se registra antes que Next.js para que tambien las conexiones WebSocket lleguen saneadas.
httpServer.on("upgrade", (request) => {
  applyClientIpHeaders(request, trustedHops);
});

const app = next({ dev, dir, port, hostname: "localhost", httpServer });
const handle = app.getRequestHandler();

await app.prepare();

httpServer.on("request", (request, response) => {
  applyClientIpHeaders(request, trustedHops);
  void handle(request, response);
});

httpServer.listen(port, host, () => {
  console.log(
    `> AlfaCode HUB frontend en http://localhost:${port} (${dev ? "development" : "production"}, proxies de confianza: ${trustedHops})`,
  );
});
