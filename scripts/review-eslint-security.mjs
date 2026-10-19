// Observa el lint real sin modificar dependencias ni desactivar reglas.
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "../frontend");
const requireFrontend = createRequire(join(frontend, "package.json"));
const glob = requireFrontend("fast-glob");
const original = glob.globSync;
let rootGlobCalls = 0;
glob.globSync = (...args) => {
  rootGlobCalls += 1;
  return original(...args);
};

const { ESLint } = requireFrontend("eslint");
const results = await new ESLint({ cwd: frontend }).lintFiles(["."]);
const errors = results.reduce((total, result) => total + result.errorCount, 0);
const warnings = results.reduce((total, result) => total + result.warningCount, 0);
console.log(JSON.stringify({ filesLinted: results.length, errors, warnings, rootGlobCalls }));

console.log("Las alertas de npm audit siguen abiertas. Cero llamadas en este recorrido no demuestra ausencia de vulnerabilidad.");
if (errors || warnings) process.exitCode = 1;
