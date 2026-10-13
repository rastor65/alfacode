import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";

const checks = [
  {
    name: "Backend health",
    url: "http://localhost:4000/api/v1/health",
    validate: async (response) => {
      const data = await response.json();
      return data.status === "ok" && data.database === "ok";
    },
  },
  {
    name: "Next.js API proxy",
    url: "http://localhost:3000/api/v1/health",
    validate: async (response) => {
      const data = await response.json();
      return data.status === "ok" && data.service === "alfacode-hub-api";
    },
  },
  {
    name: "Frontend technical health page",
    url: "http://localhost:3000/system/health",
    validate: async (response) => {
      const html = await response.text();
      return html.includes("Disponible") && html.includes("alfacode-hub-api");
    },
  },
];

const processes = [];

function startProcess(name, args) {
  const command = isWindows ? "cmd.exe" : npmCommand;
  const commandArgs = isWindows
    ? ["/d", "/s", "/c", [npmCommand, ...args].join(" ")]
    : args;

  const child = spawn(command, commandArgs, {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });
  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  processes.push(child);
  return child;
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
      killer.on("close", resolve);
      killer.on("error", resolve);
    });
    return;
  }

  child.kill("SIGTERM");
}

async function waitFor(check, timeoutMs = 45_000) {
  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(check.url, { cache: "no-store" });
      if (response.ok && (await check.validate(response))) {
        console.log(`OK ${check.name}: ${check.url}`);
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`${check.name} failed at ${check.url}: ${lastError}`);
}

async function main() {
  startProcess("backend", ["--prefix", "backend", "run", "start:dev"]);
  startProcess("frontend", ["--prefix", "frontend", "run", "dev"]);

  try {
    for (const check of checks) {
      await waitFor(check);
    }
  } finally {
    await Promise.all(processes.map(stopProcess));
  }
}

main().catch(async (error) => {
  await Promise.all(processes.map(stopProcess));
  console.error(error);
  process.exitCode = 1;
});
