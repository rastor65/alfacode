// Prueba E2E del HUB: cierre de la Fase 2 (pruebas F2 #9, #11 en SQLite y #12), investigacion
// (I-14) y documentos (I-15) de la Fase 3, cierre Fase 4 (I-19), Fase 5 (I-20 a I-22) y Fase 6 (I-23/I-24), por API y paginas SSR.
// Usa una base SQLite, un outbox y documentos temporales y los puertos 4100 (API) y 3100 (web); no
// toca la base local. El frontend se compila en `frontend/.next/e2e` con el proxy hacia la API
// temporal: nunca envia peticiones al backend de desarrollo (puerto 4000). Requiere el backend
// compilado (`npm run e2e` lo compila).
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = join(root, "backend");
const isWindows = process.platform === "win32";
const PORT = 4100;
const API = `http://localhost:${PORT}/api/v1`;
const WEB_PORT = 3100;
const ORIGIN = `http://localhost:${WEB_PORT}`;

if (process.argv.includes("--review") && !process.stdin.isTTY) {
  throw new Error("El modo --review requiere una terminal interactiva (TTY) para cerrar con Enter.");
}

const workDir = await mkdtemp(join(tmpdir(), "alfacode-e2e-"));
const outboxDir = join(workDir, "outbox");
const env = {
  ...process.env,
  NODE_ENV: "development",
  BACKEND_PORT: String(PORT),
  DB_TYPE: "sqlite",
  SQLITE_PATH: join(workDir, "e2e.sqlite"),
  MAIL_TRANSPORT: "outbox",
  MAIL_OUTBOX_DIR: outboxDir,
  STORAGE_DRIVER: "local",
  DOCUMENTS_DIR: join(workDir, "documents"),
  APP_PUBLIC_URL: ORIGIN,
  CORS_ORIGINS: ORIGIN,
  TRUST_PROXY: "loopback",
  ALLOWED_EMAIL_DOMAINS: "uniguajira.edu.co",
};

let passed = 0;
function check(name, condition, detail) {
  if (!condition) {
    throw new Error(`FALLO: ${name}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
  passed += 1;
  console.log(`OK ${name}`);
}

function runBackendScript(script, extraEnv = {}) {
  const [command, args] = isWindows
    ? ["cmd.exe", ["/d", "/s", "/c", `npm run --silent ${script}`]]
    : ["npm", ["run", "--silent", script]];
  const result = spawnSync(command, args, { cwd: backendDir, env: { ...env, ...extraEnv }, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${script} fallo:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

let server;
let web;

/**
 * Frontend de produccion propio de la prueba. No se usa `next dev` (Next.js no admite dos en la
 * misma carpeta y el de quien desarrolla puede estar abierto) ni la compilacion normal: el
 * destino del proxy `/api/v1` queda fijado al compilar y apuntaria al backend de desarrollo.
 */
const webEnv = {
  ...process.env,
  NEXT_DIST_DIR: ".next/e2e",
  API_PROXY_TARGET: `http://localhost:${PORT}`,
  PORT: String(WEB_PORT),
  NODE_ENV: "production",
};

function buildWeb() {
  const [command, args] = isWindows ? ["cmd.exe", ["/d", "/s", "/c", "npx next build"]] : ["npx", ["next", "build"]];
  const result = spawnSync(command, args, { cwd: join(root, "frontend"), env: webEnv, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`next build fallo:\n${result.stdout}\n${result.stderr}`);
  }
}

let webLogs = "";

async function startWeb() {
  web = spawn(process.execPath, ["server/index.mjs"], {
    cwd: join(root, "frontend"),
    env: webEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  web.stdout.on("data", (data) => (webLogs += data));
  web.stderr.on("data", (data) => (webLogs += data));
  const startedAt = Date.now();
  while (Date.now() - startedAt < 120_000) {
    try {
      if ((await fetch(`${ORIGIN}/ingresar`)).ok) return;
    } catch {
      // aun no escucha
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`El frontend no arranco:\n${webLogs}`);
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((r) => child.once("exit", r));
  if (isWindows) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
  await exited;
}

async function startServer() {
  server = spawn(process.execPath, ["dist/main.js"], { cwd: backendDir, env, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  server.stdout.on("data", (data) => (logs += data));
  server.stderr.on("data", (data) => (logs += data));
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    try {
      if ((await fetch(`${API}/health`)).ok) return;
    } catch {
      // aun no escucha
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`El backend no arranco:\n${logs}`);
}

async function stopServer() {
  await stopProcess(server);
}

/** Cliente con cookies y CSRF propios; cada uno simula una IP distinta tras el proxy local. */
let ipCounter = 10;
function client() {
  const ip = `10.0.0.${ipCounter++}`;
  let cookies = [];
  let csrf;
  return {
    async call(method, path, body) {
      const headers = { Origin: ORIGIN, "X-Forwarded-For": ip };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (cookies.length) headers.Cookie = cookies.join("; ");
      if (csrf) headers["X-CSRF-Token"] = csrf;
      const response = await fetch(`${API}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      return { status: response.status, json: text ? JSON.parse(text) : null };
    },
    async login(email, password) {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { Origin: ORIGIN, "X-Forwarded-For": ip, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (response.ok) {
        cookies = response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]);
        csrf = json.csrfToken;
      }
      return { status: response.status, json };
    },
    /** Carga multipart, directa a la API o a traves del proxy de Next.js (`viaWeb`). */
    async upload(path, content, name, fields = {}, viaWeb = false) {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) form.append(key, value);
      form.append("file", new Blob([new Uint8Array(content)]), name);
      const response = await fetch(`${viaWeb ? `${ORIGIN}/api/v1` : API}${path}`, {
        method: "POST",
        headers: { Origin: ORIGIN, "X-Forwarded-For": ip, Cookie: cookies.join("; "), "X-CSRF-Token": csrf },
        body: form,
      });
      const text = await response.text();
      return { status: response.status, json: text ? JSON.parse(text) : null };
    },
    async download(id, viaWeb = false) {
      const response = await fetch(`${viaWeb ? `${ORIGIN}/api/v1` : API}/documents/${id}/download`, {
        headers: { "X-Forwarded-For": ip, Cookie: cookies.join("; ") },
      });
      return { status: response.status, body: Buffer.from(await response.arrayBuffer()), headers: response.headers };
    },
    /** Pagina del frontend renderizada en el servidor con la sesion de este cliente. */
    async page(path) {
      const response = await fetch(`${ORIGIN}${path}`, {
        headers: { Cookie: cookies.join("; "), "X-Forwarded-For": ip },
        redirect: "manual",
      });
      return { status: response.status, html: await response.text() };
    },
  };
}

async function readOutbox(email) {
  const files = (await readdir(outboxDir)).sort();
  for (const file of files.reverse()) {
    const content = await readFile(join(outboxDir, file), "utf8");
    if (content.startsWith(`To: ${email}`)) return content;
  }
  throw new Error(`No hay correo para ${email}`);
}

const ok = (response) => response.status >= 200 && response.status < 300;
/** PDF minimo valido, con relleno hasta el tamano pedido. */
function pdf(size = 0, marker = "") {
  const head = Buffer.from(`%PDF-1.4\n% ${marker}\n`, "latin1");
  return Buffer.concat([head, Buffer.alloc(Math.max(0, size - head.length - 6), 0x20), Buffer.from("\n%%EOF", "latin1")]);
}

const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");

const items = (json) => (Array.isArray(json) ? json : json.items);

async function main() {
  // F2 #11 (parte SQLite): todas las migraciones desde cero, ida, vuelta e ida.
  runBackendScript("migration:run");
  check("migraciones aplicadas desde cero", runBackendScript("migration:show").includes("Pending migrations: false"));
  const { migrations } = await import(`file://${join(backendDir, "dist/database/database.options.js").replace(/\\/g, "/")}`);
  for (let i = 0; i < migrations.length; i++) runBackendScript("migration:revert");
  check(`las ${migrations.length} migraciones se revierten`, runBackendScript("migration:show").includes("Pending migrations: true"));
  runBackendScript("migration:run");
  check("migraciones reaplicadas", runBackendScript("migration:show").includes("Pending migrations: false"));

  runBackendScript("seed:roles");
  const adminEmail = "admin.e2e@uniguajira.edu.co";
  const adminPassword = "Admin-E2E-clave-larga-1";
  runBackendScript("bootstrap:admin", { BOOTSTRAP_ADMIN_EMAIL: adminEmail, BOOTSTRAP_ADMIN_PASSWORD: adminPassword });

  await startServer();

  const admin = client();
  check("login del admin", (await admin.login(adminEmail, adminPassword)).status === 200);

  // Invitacion: coordinador.
  const coordEmail = "coord.e2e@uniguajira.edu.co";
  const coordPassword = "Coord-E2E-clave-larga-1";
  const invite = await admin.call("POST", "/invitations", { email: coordEmail, roleCode: "coordinator" });
  check("el admin invita a un coordinador", ok(invite), invite);
  const token = (await readOutbox(coordEmail)).match(/#token=([A-Za-z0-9_-]+)/)?.[1];
  const anon = client();
  const accepted = await anon.call("POST", "/invitations/accept", { token, fullName: "Coordinadora E2E", password: coordPassword });
  check("el coordinador acepta la invitacion", ok(accepted), accepted);
  const coord = client();
  check("login del coordinador", (await coord.login(coordEmail, coordPassword)).status === 200);

  // Registro publico con hoja de vida: estudiante.
  const studentEmail = "estudiante.e2e@uniguajira.edu.co";
  const registered = await anon.call("POST", "/auth/register", {
    fullName: "Estudiante E2E",
    email: studentEmail,
    message: "Quiero unirme al semillero",
    cvData: { programa: "Ingenieria de Sistemas", semestreActual: "6", areasEstudio: "Desarrollo web" },
  });
  check("el estudiante envia su solicitud con hoja de vida", ok(registered), registered);
  const pending = await admin.call("GET", "/membership-requests?status=pending");
  const request = items(pending.json).find((r) => JSON.stringify(r).includes(studentEmail));
  check("la solicitud aparece pendiente con la hoja de vida", Boolean(request) && JSON.stringify(request).includes("Ingenieria de Sistemas"), pending.json);
  const approved = await admin.call("POST", `/membership-requests/${request.id}/approve`, { roleCode: "student" });
  check("el admin aprueba la solicitud", ok(approved) && approved.json.credentials?.delivery === "email", approved);
  const temporary = (await readOutbox(studentEmail)).match(/Contrasena temporal: (\S+)/)?.[1];
  const student = client();
  const firstLogin = await student.login(studentEmail, temporary);
  check("login con la contrasena temporal", firstLogin.status === 200, firstLogin);
  const studentPassword = "Estudiante-E2E-clave-1";
  const changed = await student.call("POST", "/auth/change-password", { currentPassword: temporary, newPassword: studentPassword });
  check("cambio obligatorio de contrasena", ok(changed), changed);
  check("login con la contrasena nueva", (await student.login(studentEmail, studentPassword)).status === 200);
  const studentId = (await student.call("GET", "/auth/me")).json.user?.id ?? (await student.call("GET", "/auth/me")).json.id;

  // Proyecto agil, equipo y tareas.
  const project = await coord.call("POST", "/projects", {
    name: "Proyecto E2E",
    type: "software",
    methodology: "agile",
    joinAsLeader: true,
  });
  check("el coordinador crea un proyecto agil", ok(project), project);
  const projectId = project.json.id;
  const member = await coord.call("POST", `/projects/${projectId}/members`, { userId: studentId, role: "collaborator" });
  check("el estudiante entra al equipo como colaborador", ok(member), member);
  const activated = await coord.call("POST", `/projects/${projectId}/status`, { status: "active" });
  check("el proyecto se activa", ok(activated), activated);

  const progressEmpty = await coord.call("GET", `/projects/${projectId}`);
  check("sin tareas el progreso es 0 de 0 (F2 #10)", progressEmpty.json.progress?.total === 0, progressEmpty.json.progress);

  const createTask = async (title, assigneeId) =>
    (await coord.call("POST", `/projects/${projectId}/tasks`, { title, ...(assigneeId ? { assigneeId } : {}) })).json;
  const taskA = await createTask("Tarea del estudiante", studentId);
  const taskB = await createTask("Tarea pendiente");
  const taskC = await createTask("Tarea que queda en backlog");
  check("se crean tres tareas en el backlog", [taskA, taskB, taskC].every((t) => t?.id && t.sprintId == null), [taskA, taskB, taskC]);

  // Sprint.
  const forbidden = await student.call("POST", `/projects/${projectId}/sprints`, { name: "Sprint del colaborador", startDate: "2026-10-15", endDate: "2026-10-29" });
  check("un colaborador no crea sprints (F2 #8)", forbidden.status === 403, forbidden);
  const sprint = await coord.call("POST", `/projects/${projectId}/sprints`, {
    name: "Sprint 1",
    goal: "Cerrar el flujo",
    startDate: "2026-10-15",
    endDate: "2026-10-29",
  });
  check("el lider crea un sprint", ok(sprint), sprint);
  const sprintId = sprint.json.id;
  const planned = await coord.call("POST", `/projects/${projectId}/sprints/${sprintId}/tasks`, { taskIds: [taskA.id, taskB.id] });
  check("se planifican dos tareas en el sprint", ok(planned), planned);
  const started = await coord.call("POST", `/projects/${projectId}/sprints/${sprintId}/start`);
  check("el sprint se inicia", ok(started), started);

  const moveA = await student.call("PATCH", `/projects/${projectId}/tasks/${taskA.id}`, { status: "in_progress" });
  check("el estudiante mueve su tarea en el tablero", moveA.status === 200, moveA);
  check("el estudiante la termina", (await student.call("PATCH", `/projects/${projectId}/tasks/${taskA.id}`, { status: "done" })).status === 200);
  check(
    "el lider mueve otra tarea a en progreso",
    (await coord.call("PATCH", `/projects/${projectId}/tasks/${taskB.id}`, { status: "in_progress" })).status === 200,
  );

  // F2 #9: persistencia tras reiniciar el servidor.
  await stopServer();
  await startServer();
  check("las sesiones siguen validas tras reiniciar", (await coord.call("GET", "/auth/me")).status === 200);
  const afterRestart = await coord.call("GET", `/projects/${projectId}/sprints/${sprintId}`);
  check(
    "el sprint activo y sus tareas persisten tras reiniciar (F2 #9)",
    afterRestart.json.status === "active" && afterRestart.json.tasks.find((t) => t.id === taskA.id)?.status === "done",
    afterRestart.json,
  );

  // Cierre e historial.
  const completed = await coord.call("POST", `/projects/${projectId}/sprints/${sprintId}/complete`);
  check("el lider cierra el sprint", ok(completed), completed);
  const history = await student.call("GET", `/projects/${projectId}/sprints/${sprintId}`);
  const closure = history.json.closure ?? [];
  check(
    "el historial del cierre registra el estado final de cada tarea",
    history.json.status === "completed" &&
      closure.length === 2 &&
      closure.find((i) => i.taskId === taskA.id)?.statusAtClose === "done" &&
      closure.find((i) => i.taskId === taskB.id)?.statusAtClose === "in_progress",
    history.json,
  );
  const tasksNow = items((await coord.call("GET", `/projects/${projectId}/tasks?pageSize=100`)).json);
  check(
    "la terminada conserva el sprint y la pendiente vuelve al backlog",
    tasksNow.find((t) => t.id === taskA.id)?.sprintId === sprintId && tasksNow.find((t) => t.id === taskB.id)?.sprintId == null,
    tasksNow,
  );
  const progress = (await coord.call("GET", `/projects/${projectId}`)).json.progress;
  check("el progreso del proyecto refleja 1 de 3 terminadas", progress?.total === 3 && progress?.done === 1, progress);

  // F2 #7: un ajeno no ve el proyecto aunque conozca los ID.
  const outsiderEmail = "ajeno.e2e@uniguajira.edu.co";
  await admin.call("POST", "/invitations", { email: outsiderEmail, roleCode: "student" });
  const outsiderToken = (await readOutbox(outsiderEmail)).match(/#token=([A-Za-z0-9_-]+)/)?.[1];
  await anon.call("POST", "/invitations/accept", { token: outsiderToken, fullName: "Persona Ajena", password: "Ajena-E2E-clave-larga-1" });
  const outsider = client();
  await outsider.login(outsiderEmail, "Ajena-E2E-clave-larga-1");
  const peek = await outsider.call("GET", `/projects/${projectId}/sprints/${sprintId}`);
  check("un ajeno recibe 404 al consultar el historial por ID (F2 #7)", peek.status === 404, peek);

  // Fase 3, I-14: investigacion (F3-01 a F3-04).
  const lineName = "Ingeniería de software educativo";
  const line = await coord.call("POST", "/research-lines", { name: lineName, objectives: "Objetivos de la linea" });
  check("la coordinacion crea una linea de investigacion (F3-01)", ok(line), line);
  check(
    "un estudiante no gestiona lineas",
    (await student.call("POST", "/research-lines", { name: "Linea no autorizada" })).status === 403,
  );
  const linked = await coord.call("POST", `/projects/${projectId}/research-lines`, { researchLineId: line.json.id });
  check("la linea se asocia al proyecto (F3-02)", ok(linked) && linked.json.items.length === 1, linked);
  const profileBefore = await student.call("GET", `/projects/${projectId}/research-profile`);
  check("el proyecto funciona sin ficha (F3-03)", profileBefore.status === 200 && profileBefore.json.profile === null, profileBefore);
  const savedProfile = await coord.call("PUT", `/projects/${projectId}/research-profile`, {
    problem: "Baja retencion en cursos de programacion",
    question: "Que estrategias mejoran la retencion?",
  });
  check("el lider guarda la ficha investigativa", ok(savedProfile) && savedProfile.json.profile.problem.startsWith("Baja"), savedProfile);
  const result = await coord.call("POST", `/projects/${projectId}/research-results`, {
    title: "Prototipo de tutor adaptativo",
    type: "prototype",
    resultDate: "2026-10-10",
    participantIds: [studentId],
  });
  check("el lider registra un resultado con participantes (F3-04)", ok(result) && result.json.participants.length === 1, result);
  const studentResults = await student.call("GET", `/projects/${projectId}/research-results`);
  check(
    "el colaborador consulta los resultados pero no los gestiona",
    studentResults.json.items.length === 1 && studentResults.json.permissions.canManageResults === false,
    studentResults.json,
  );
  check(
    "un ajeno no consulta la investigacion del proyecto",
    (await outsider.call("GET", `/projects/${projectId}/research-results`)).status === 404,
  );

  // Fase 3, I-15: documentos (F3-05 a F3-09, DEC-029).
  const report = pdf(4096, "informe");
  const restrictedDoc = await coord.upload(`/projects/${projectId}/documents`, report, "Informe de avance.pdf", {
    category: "report",
    researchResultId: result.json.id,
  });
  check("el lider sube un documento restringido vinculado al resultado (F3-05)", restrictedDoc.status === 201, restrictedDoc);
  const studentCopy = await student.download(restrictedDoc.json.id);
  check(
    "el equipo descarga el mismo contenido como adjunto",
    studentCopy.status === 200 && sha(studentCopy.body) === sha(report) &&
      studentCopy.headers.get("content-disposition")?.startsWith("attachment"),
    studentCopy.status,
  );
  check("un ajeno no descarga un documento restringido (F3-08)", (await outsider.download(restrictedDoc.json.id)).status === 404);
  const forged = await student.upload(`/projects/${projectId}/documents`, Buffer.from("<script>alert(1)</script>"), "falso.pdf");
  check("se rechaza un archivo cuyo contenido no es el de su extension (F3-07)", forged.status === 415, forged);
  const privateDoc = await student.upload(`/projects/${projectId}/documents`, pdf(1024, "privado"), "Notas.pdf", { accessLevel: "private" });
  check("un integrante sube un documento privado", privateDoc.status === 201, privateDoc);
  check(
    "la coordinacion ve los privados y el resto no (DEC-029)",
    (await coord.download(privateDoc.json.id)).status === 200 && (await outsider.download(privateDoc.json.id)).status === 404,
  );
  const institutional = await coord.upload("/documents", pdf(2048, "formato"), "Formato de asistencia.pdf", { category: "administrative" });
  check(
    "la coordinacion publica un documento institucional que todos descargan",
    institutional.status === 201 && (await outsider.download(institutional.json.id)).status === 200,
    institutional,
  );

  // Paginas reales del frontend (SSR a traves del servidor de Next.js).
  buildWeb();
  await startWeb();

  // Cargas grandes a traves del proxy de Next.js: el limite es el del backend (20 MiB).
  const large = pdf(19 * 1024 * 1024, "grande");
  const viaProxy = await coord.upload(`/projects/${projectId}/documents`, large, "Anexo grande.pdf", {}, true);
  check("un archivo de 19 MiB se sube a traves del proxy de Next.js", viaProxy.status === 201 && viaProxy.json.sizeBytes === large.length, viaProxy.status);
  const largeCopy = await coord.download(viaProxy.json.id, true);
  check("y se descarga integro a traves del proxy", largeCopy.status === 200 && sha(largeCopy.body) === sha(large), largeCopy.status);
  const tooLarge = await coord.upload(`/projects/${projectId}/documents`, pdf(20 * 1024 * 1024 + 1, "excesivo"), "Excesivo.pdf", {}, true);
  check("un archivo de mas de 20 MiB se rechaza con 413", tooLarge.status === 413, tooLarge.status);

  const catalog = await student.page("/hub/investigacion");
  check("la pagina de lineas muestra la linea", catalog.status === 200 && catalog.html.includes(lineName), catalog.status);
  const researchPage = await student.page(`/hub/proyectos/${projectId}/investigacion`);
  check(
    "la pestana de investigacion muestra linea, ficha y resultado",
    researchPage.status === 200 &&
      researchPage.html.includes(lineName) &&
      researchPage.html.includes("Baja retencion en cursos de programacion") &&
      researchPage.html.includes("Prototipo de tutor adaptativo"),
    researchPage.status,
  );
  const foreignPage = await outsider.page(`/hub/proyectos/${projectId}/investigacion`);
  check("un ajeno ve la pagina de no encontrado", foreignPage.status === 404, foreignPage.status);
  const anonymousPage = await anon.page("/hub/investigacion");
  check("sin sesion se redirige al ingreso", [302, 303, 307].includes(anonymousPage.status), anonymousPage.status);
  check(
    "la pestana de investigacion enlaza el documento del resultado",
    (await student.page(`/hub/proyectos/${projectId}/investigacion`)).html.includes(`/api/v1/documents/${restrictedDoc.json.id}/download`),
  );
  const projectDocs = await student.page(`/hub/proyectos/${projectId}/documentos`);
  check(
    "la pestana de documentos muestra los del equipo pero no los privados ajenos",
    projectDocs.status === 200 && projectDocs.html.includes("Informe de avance") && projectDocs.html.includes("Notas"),
    projectDocs.status,
  );
  const repository = await outsider.page("/hub/documentos");
  check(
    "el repositorio de un ajeno muestra lo institucional y no lo restringido",
    repository.status === 200 && repository.html.includes("Formato de asistencia") && !repository.html.includes("Informe de avance"),
    repository.status,
  );
  check("un ajeno ve no encontrado en los documentos del proyecto", (await outsider.page(`/hub/proyectos/${projectId}/documentos`)).status === 404);

  // I-17: produccion academica, autoria externa y evidencia reutilizada de documentos.
  const coordId = (await coord.call("GET", "/auth/me")).json.id;
  const academicPayload = { title: "Articulo E2E del tutor", type: "article", status: "submitted", projectId,
    authors: [{ userId: studentId }, { externalName: "Colaboradora externa ficticia" }, { userId: coordId }], resultIds: [result.json.id], productDate: "2026-10-18" };
  const academic = await coord.call("POST", "/academic-products", academicPayload);
  check("I-17: producto con autoria interna, externa y resultado del proyecto", academic.status === 201 && academic.json.authors?.length === 3 && academic.json.results?.[0]?.id === result.json.id, academic);
  check("I-17: colaborador consulta pero no modifica el producto", (await student.call("GET", `/academic-products/${academic.json.id}`)).status === 200 &&
    (await student.call("PUT", `/academic-products/${academic.json.id}`, academicPayload)).status === 403);
  check("I-17: ajeno no ve producto ni totales del proyecto", (await outsider.call("GET", `/academic-products/${academic.json.id}`)).status === 404 &&
    (await outsider.call("GET", `/academic-products?projectId=${projectId}`)).json.total === 0);
  const recognition = await coord.call("POST", "/recognitions", { title: "Reconocimiento E2E", userId: studentId, projectId, recognitionDate: "2026-10-18", evidenceDocumentId: restrictedDoc.json.id });
  check("I-17: reconocimiento reutiliza la evidencia documental", recognition.status === 201 && recognition.json.evidence?.id === restrictedDoc.json.id, recognition);
  const academicPage = await student.page(`/hub/proyectos/${projectId}/produccion`);
  check("I-17: pagina del proyecto muestra el producto y autoria externa", academicPage.status === 200 && academicPage.html.includes("Articulo E2E del tutor") && academicPage.html.includes("Colaboradora externa ficticia"), academicPage.status);
  const profileProducts = await student.page(`/hub/produccion?integrante=${studentId}`);
  check("I-17: historial del integrante respeta filtros y permisos", profileProducts.status === 200 && profileProducts.html.includes("Articulo E2E del tutor"), profileProducts.status);
  check("I-17: pagina de reconocimientos del proyecto", (await student.page(`/hub/proyectos/${projectId}/produccion?vista=recognitions`)).html.includes("Reconocimiento E2E"));
  check("I-17: pagina del proyecto ajeno devuelve 404", (await outsider.page(`/hub/proyectos/${projectId}/produccion`)).status === 404);

  // I-18: actividad, asistencia y calendario con fechas explicitas de Bogota.
  const activity = await coord.call("POST", "/events", { title: "Actividad E2E del proyecto", type: "training", mode: "onsite", location: "Sala ficticia", organizerId: (await coord.call("GET", "/auth/me")).json.id, projectId,
    startsAt: "2026-10-18T09:00:00-05:00", endsAt: "2026-10-18T11:00:00-05:00" });
  check("I-18: actividad programada con organizador y UTC normalizado", activity.status === 201 && activity.json.status === "scheduled" && activity.json.startsAt === "2026-10-18T14:00:00.000Z", activity);
  check("I-18: registra participante sin duplicar", (await coord.call("POST", `/events/${activity.json.id}/participants`, { userId: studentId, role: "participant" })).status === 201 &&
    (await coord.call("POST", `/events/${activity.json.id}/participants`, { userId: studentId, role: "participant" })).status === 409);
  check("I-18: ajeno no ve evento ni altera asistencia", (await outsider.call("GET", `/events/${activity.json.id}`)).status === 404 &&
    (await outsider.call("PATCH", `/events/${activity.json.id}/participants/${studentId}/attendance`, { attendance: "attended" })).status === 404);
  check("I-18: inicia actividad y solo autoridad confirma asistencia", (await coord.call("POST", `/events/${activity.json.id}/status`, { status: "in_progress" })).status === 200 &&
    (await student.call("PATCH", `/events/${activity.json.id}/participants/${studentId}/attendance`, { attendance: "attended" })).status === 403 &&
    (await coord.call("PATCH", `/events/${activity.json.id}/participants/${studentId}/attendance`, { attendance: "attended" })).status === 200);
  check("I-18: finaliza conservando la asistencia opcional", (await coord.call("POST", `/events/${activity.json.id}/status`, { status: "completed" })).status === 200 &&
    (await student.call("GET", `/events/${activity.json.id}/participants`)).json.items.some(p => p.userId === studentId && p.attendance === "attended"));
  check("I-18: vincula evidencia existente sin copiar archivos", (await coord.call("POST", `/events/${activity.json.id}/documents`, { documentId: restrictedDoc.json.id })).status === 201 &&
    (await student.call("GET", `/events/${activity.json.id}/documents`)).json.items.some(d => d.id === restrictedDoc.json.id));
  const callActivity = await coord.call("POST", "/events", { title: "Convocatoria E2E institucional", type: "call", mode: "online", url: "https://example.org/convocatoria", organizerId: activity.json.organizerId,
    startsAt: "2026-10-19T09:00:00-05:00", endsAt: "2026-10-25T18:00:00-05:00", externalOrganizer: "Entidad ficticia", requirements: "Resumen y formulario externo", registrationUrl: "https://example.org/inscripcion" });
  check("I-18: convocatoria institucional consultable sin postulacion interna", callActivity.status === 201 && (await outsider.call("GET", `/events/${callActivity.json.id}`)).json.requirements === "Resumen y formulario externo", callActivity);
  const calendar = await student.page(`/hub/proyectos/${projectId}/actividades?mes=2026-10`);
  check("I-18: calendario del proyecto incluye la actividad", calendar.status === 200 && calendar.html.includes("Actividad E2E del proyecto") && calendar.html.includes("2026-10-18"), calendar.status);
  const publicCalendar = await outsider.page("/hub/actividades?mes=2026-10");
  check("I-18: calendario respeta visibilidad y muestra convocatoria institucional", publicCalendar.status === 200 && publicCalendar.html.includes("Convocatoria E2E institucional") && !publicCalendar.html.includes("Actividad E2E del proyecto"), publicCalendar.status);
  check("I-18: pagina de actividades ajenas devuelve 404", (await outsider.page(`/hub/proyectos/${projectId}/actividades?mes=2026-10`)).status === 404);

  // I-19: relaciones y permisos acumulados; solo datos ficticios de este recorrido.
  for (const authorId of [studentId, coordId]) {
    const history = await student.call("GET", `/academic-products?authorId=${authorId}&pageSize=1`);
    const page = await student.page(`/hub/produccion?integrante=${authorId}`);
    check(`I-19: historial del autor ${authorId === studentId ? "estudiante" : "coordinador"} incluye el mismo producto una sola vez`,
      history.status === 200 && history.json.total === 1 && history.json.items[0]?.id === academic.json.id &&
      page.status === 200 && page.html.includes(academicPayload.title));
  }
  check("I-19: filtrar por autor no revela el producto a un ajeno",
    (await outsider.call("GET", `/academic-products?authorId=${studentId}&pageSize=1`)).json.total === 0 &&
    !(await outsider.page(`/hub/produccion?integrante=${studentId}`)).html.includes(academicPayload.title));
  check("I-19: el filtro de fecha Bogota incluye la actividad completada solo en su dia",
    (await student.call("GET", `/events?projectId=${projectId}&status=completed&from=2026-10-18&to=2026-10-18`)).json.total === 1 &&
    (await student.call("GET", `/events?projectId=${projectId}&from=2026-10-19&to=2026-10-19`)).json.total === 0);
  check("I-19: finalizar no confirma automaticamente asistencia del organizador",
    (await coord.call("GET", `/events/${activity.json.id}/participants`)).json.items.find(p => p.userId === coordId)?.attendance === "registered");
  check("I-19: no se reabre una actividad completada ni se borra con historial",
    (await coord.call("POST", `/events/${activity.json.id}/status`, { status: "in_progress" })).status === 409 &&
    (await coord.call("DELETE", `/events/${activity.json.id}`)).status === 409);
  check("I-19: desvincular evidencia conserva el documento compartido con reconocimiento",
    (await coord.call("DELETE", `/events/${activity.json.id}/documents/${restrictedDoc.json.id}`)).status === 204 &&
    (await student.download(restrictedDoc.json.id)).status === 200 &&
    (await student.call("GET", `/recognitions/${recognition.json.id}`)).json.evidence?.id === restrictedDoc.json.id);
  check("I-19: se vuelve a vincular la misma evidencia sin duplicarla",
    (await coord.call("POST", `/events/${activity.json.id}/documents`, { documentId: restrictedDoc.json.id })).status === 201 &&
    (await coord.call("GET", `/events/${activity.json.id}/documents`)).json.total === 1);
  check("I-19: retirar del proyecto revoca acceso aunque conserve autoria y asistencia",
    (await coord.call("DELETE", `/projects/${projectId}/members/${studentId}`)).status === 200 &&
    (await student.call("GET", `/academic-products/${academic.json.id}`)).status === 404 &&
    (await student.call("GET", `/events/${activity.json.id}`)).status === 404 &&
    (await student.call("PATCH", `/events/${activity.json.id}/participants/${studentId}/attendance`, { attendance: "absent" })).status === 404 &&
    (await student.call("GET", `/academic-products?authorId=${studentId}`)).json.total === 0 &&
    (await student.call("GET", `/events?projectId=${projectId}`)).json.total === 0);
  check("I-19: las paginas del proyecto retirado tambien devuelven 404",
    (await student.page(`/hub/proyectos/${projectId}/produccion`)).status === 404 &&
    (await student.page(`/hub/proyectos/${projectId}/actividades?mes=2026-10`)).status === 404);
  check("I-19: autoridades conservan autoria, asistencia y evidencia tras retirar al integrante",
    (await coord.call("GET", `/academic-products/${academic.json.id}`)).json.authors.some(a => a.userId === studentId) &&
    (await coord.call("GET", `/events/${activity.json.id}/participants`)).json.items.some(p => p.userId === studentId && p.attendance === "attended") &&
    (await coord.call("GET", `/events/${activity.json.id}/documents`)).json.items.some(d => d.id === restrictedDoc.json.id));
  // Restaurar pertenencia facilita la revision manual posterior, sin recrear las relaciones.
  check("I-19: reincorporar recupera acceso sin duplicar autores ni participantes",
    (await coord.call("POST", `/projects/${projectId}/members`, { userId: studentId, role: "collaborator" })).status === 201 &&
    (await student.call("GET", `/academic-products/${academic.json.id}`)).json.authors.length === 3 &&
    (await student.call("GET", `/events/${activity.json.id}/participants`)).json.total === 2);

  // I-20: tramites institucionales; no reutiliza ni duplica solicitudes de vinculacion.
  const administrative = await student.call("POST", "/administrative-requests", {
    type: "certificate", subject: "Constancia E2E de participacion", description: "Solicito una constancia ficticia para el recorrido de pruebas",
  });
  check("I-20: integrante registra solicitud propia pendiente", administrative.status === 201 && administrative.json.status === "pending" && administrative.json.requesterId === studentId, administrative);
  const requestDocument = await student.upload(`/administrative-requests/${administrative.json.id}/documents`, pdf(1536, "tramite"), "Soporte privado de tramite.pdf", { title: "Soporte privado E2E" }, true);
  check("I-21: solicitante adjunta usando Gestion documental por el proxy", requestDocument.status === 201 && requestDocument.json.accessLevel === "private" && requestDocument.json.administrativeRequestId === administrative.json.id, requestDocument);
  check("I-21: adjunto solo consultable por solicitante y autoridades",
    (await coord.download(requestDocument.json.id)).status === 200 && (await outsider.download(requestDocument.json.id)).status === 404 &&
    !(await outsider.call("GET", "/documents?pageSize=100")).json.items.some(d => d.id === requestDocument.json.id));
  check("I-20: ajeno no consulta solicitud, historial ni totales",
    (await outsider.call("GET", `/administrative-requests/${administrative.json.id}`)).status === 404 &&
    (await outsider.call("GET", `/administrative-requests/${administrative.json.id}/history`)).status === 404 &&
    (await outsider.call("GET", "/administrative-requests")).json.total === 0);
  check("I-20: solicitante no aprueba y no puede saltarse la revision",
    (await student.call("POST", `/administrative-requests/${administrative.json.id}/status`, { status: "approved", response: "Intento sin permiso" })).status === 403 &&
    (await coord.call("POST", `/administrative-requests/${administrative.json.id}/status`, { status: "approved", response: "Intento de salto" })).status === 409);
  check("I-20: autoridad inicia revision y queda asignada",
    (await coord.call("POST", `/administrative-requests/${administrative.json.id}/status`, { status: "in_review" })).json.reviewerId === coordId);
  check("I-20: autoridad aprueba con respuesta sin completar automaticamente",
    (await coord.call("POST", `/administrative-requests/${administrative.json.id}/status`, { status: "approved", response: "Se aprueba la solicitud ficticia" })).json.status === "approved" &&
    (await student.call("GET", `/administrative-requests/${administrative.json.id}`)).json.completedAt === null);
  check("I-20: autoridad registra ejecucion manual del tramite",
    (await coord.call("POST", `/administrative-requests/${administrative.json.id}/status`, { status: "completed", response: "Constancia preparada manualmente para la prueba" })).json.completedBy === coordId);
  const requestHistory = await student.call("GET", `/administrative-requests/${administrative.json.id}/history`);
  check("I-20: solicitante consulta historial de decisiones con autor y respuesta",
    requestHistory.status === 200 && requestHistory.json.total === 5 && requestHistory.json.items.some(e => e.details?.to === "approved" && e.actor?.id === coordId));
  const ownAuthorityRequest = await coord.call("POST", "/administrative-requests", { type: "general", subject: "Peticion propia E2E de autoridad", description: "Peticion ficticia que debe revisar otra autoridad institucional" });
  check("I-20: autoridad tampoco puede revisar su propia peticion",
    ownAuthorityRequest.status === 201 && (await coord.call("POST", `/administrative-requests/${ownAuthorityRequest.json.id}/status`, { status: "in_review" })).status === 403 &&
    (await admin.call("POST", `/administrative-requests/${ownAuthorityRequest.json.id}/status`, { status: "in_review" })).status === 200);
  check("I-22: autoridad solicitante no se autoaprueba ni suplanta al solicitante por HTTP",
    (await coord.call("POST", `/administrative-requests/${ownAuthorityRequest.json.id}/status`, { status: "approved", response: "Intento de autoaprobacion" })).status === 403 &&
    (await coord.call("POST", `/administrative-requests/${ownAuthorityRequest.json.id}/status`, { status: "approved", response: "Intento de asignacion masiva", requesterId: studentId })).status === 400 &&
    (await admin.call("GET", `/administrative-requests/${ownAuthorityRequest.json.id}`)).json.status === "in_review");
  const requestPage = await student.page(`/hub/tramites/${administrative.json.id}`);
  check("I-21: detalle SSR muestra respuesta, adjunto e historial privados", requestPage.status === 200 && requestPage.html.includes("Constancia preparada manualmente") && requestPage.html.includes("Soporte privado E2E"), requestPage.status);
  check("I-21: pantallas de solicitante y revision muestran las solicitudes autorizadas",
    (await student.page("/hub/tramites")).html.includes("Constancia E2E de participacion") &&
    (await coord.page("/hub/tramites?vista=review")).html.includes("Constancia E2E de participacion"));
  check("I-21: ajeno recibe pagina 404 y su bandeja no muestra otras solicitudes",
    (await outsider.page(`/hub/tramites/${administrative.json.id}`)).status === 404 &&
    !(await outsider.page("/hub/tramites?vista=review")).html.includes("Constancia E2E de participacion"));
  check("I-21: no se publica un adjunto ni se elimina despues de completar el tramite",
    (await student.call("PATCH", `/documents/${requestDocument.json.id}`, { accessLevel: "general" })).status === 409 &&
    (await coord.call("DELETE", `/documents/${requestDocument.json.id}`)).status === 409);

  // I-16: persistencia e integridad de la Fase 3 sobre la base aislada.
  await stopServer();
  await startServer();
  const persistedProfile = await student.call("GET", `/projects/${projectId}/research-profile`);
  const persistedResults = await student.call("GET", `/projects/${projectId}/research-results`);
  const persistedLines = await student.call("GET", `/projects/${projectId}/research-lines`);
  check("lineas, ficha y resultados persisten tras reiniciar", persistedProfile.status === 200 &&
    persistedProfile.json.profile?.problem === savedProfile.json.profile.problem &&
    persistedResults.json.items?.some((item) => item.id === result.json.id) &&
    persistedLines.json.items?.some((item) => item.id === line.json.id));
  const persistedDocument = await student.download(restrictedDoc.json.id);
  check("el documento persiste integro tras reiniciar", persistedDocument.status === 200 && sha(persistedDocument.body) === sha(report));
  check("los permisos documentales persisten tras reiniciar", (await outsider.download(restrictedDoc.json.id)).status === 404 &&
    (await coord.download(privateDoc.json.id)).status === 200 && (await outsider.download(privateDoc.json.id)).status === 404);
  check("I-17: producto, autoria y reconocimiento persisten tras reiniciar", (await student.call("GET", `/academic-products/${academic.json.id}`)).json.authors?.[1]?.externalName === "Colaboradora externa ficticia" &&
    (await student.call("GET", `/recognitions/${recognition.json.id}`)).json.evidence?.id === restrictedDoc.json.id);
  check("I-18: evento, participantes y asistencia persisten tras reiniciar", (await coord.call("GET", `/events/${activity.json.id}`)).json.status === "completed" &&
    (await student.call("GET", `/events/${activity.json.id}/participants`)).json.items.some(p => p.userId === studentId && p.attendance === "attended"));
  check("I-20: solicitud y decisiones persisten tras reiniciar",
    (await student.call("GET", `/administrative-requests/${administrative.json.id}`)).json.status === "completed" &&
    (await student.call("GET", `/administrative-requests/${administrative.json.id}/history`)).json.total === 5 &&
    (await outsider.call("GET", `/administrative-requests/${administrative.json.id}`)).status === 404);
  check("I-21: adjunto del tramite persiste integro tras reiniciar", (await student.download(requestDocument.json.id)).status === 200 &&
    (await outsider.download(requestDocument.json.id)).status === 404);

  // Salida de una cuenta ficticia independiente, conservando las cuentas para revision manual.
  const exitEmail = "salida.e2e@uniguajira.edu.co", exitPassword = "Salida-E2E-ficticia-123";
  await admin.call("POST", "/invitations", { email: exitEmail, roleCode: "student" });
  const exitToken = (await readOutbox(exitEmail)).match(/#token=([A-Za-z0-9_-]+)/)?.[1];
  const exitAccepted = await anon.call("POST", "/invitations/accept", { token: exitToken, fullName: "Salida ficticia E2E", password: exitPassword });
  const exiting = client(); check("I-21: cuenta ficticia preparada para salida", ok(exitAccepted) && (await exiting.login(exitEmail, exitPassword)).status === 200);
  const exitId = (await exiting.call("GET", "/auth/me")).json.id;
  const exitRequest = await exiting.call("POST", "/administrative-requests", { type: "withdrawal", subject: "Salida ficticia E2E", description: "Solicito mi desvinculacion en esta prueba aislada" });
  const exitContent = pdf(1792, "soporte de salida I-22");
  const exitDocument = await exiting.upload(`/administrative-requests/${exitRequest.json.id}/documents`, exitContent, "Soporte de salida.pdf");
  check("I-22: salida tiene soporte privado antes de la decision", exitDocument.status === 201 && exitDocument.json.administrativeRequestId === exitRequest.json.id, exitDocument);
  await coord.call("POST", `/administrative-requests/${exitRequest.json.id}/status`, { status: "in_review" });
  await coord.call("POST", `/administrative-requests/${exitRequest.json.id}/status`, { status: "approved", response: "Salida aprobada en prueba aislada" });
  await coord.call("POST", `/projects/${projectId}/members`, { userId: exitId, role: "collaborator" });
  const exitTask = await createTask("Responsabilidad antes de salir E2E", exitId);
  const exitProduct = await coord.call("POST", "/academic-products", { title: "Aporte historico de salida E2E", type: "software", status: "published", projectId, authors: [{ userId: exitId }] });
  const exitResult = await coord.call("POST", `/projects/${projectId}/research-results`, { title: "Resultado historico de salida E2E", participantIds: [exitId] });
  const exitDoneTask = await createTask("Tarea terminada antes de salida E2E", exitId);
  await coord.call("PATCH", `/projects/${projectId}/tasks/${exitDoneTask.id}`, { status: "in_progress" });
  const doneBeforeExit = await coord.call("PATCH", `/projects/${projectId}/tasks/${exitDoneTask.id}`, { status: "done" });
  check("I-22: integrante tiene resultado investigativo y tarea terminada antes de salir", exitResult.status === 201 && doneBeforeExit.status === 200 && doneBeforeExit.json.status === "done");
  const exitEvent = await coord.call("POST", "/events", { title: "Participacion historica de salida E2E", type: "training", mode: "online", url: "https://example.org/sesion", organizerId: coordId,
    startsAt: "2026-10-20T10:00:00-05:00", endsAt: "2026-10-20T11:00:00-05:00" });
  const exitRegistration = await coord.call("POST", `/events/${exitEvent.json.id}/participants`, { userId: exitId, role: "speaker" });
  await coord.call("POST", `/events/${exitEvent.json.id}/status`, { status: "in_progress" });
  const exitAttendance = await coord.call("PATCH", `/events/${exitEvent.json.id}/participants/${exitId}/attendance`, { attendance: "attended" });
  const exitEventCompleted = await coord.call("POST", `/events/${exitEvent.json.id}/status`, { status: "completed" });
  check("I-22: asistencia historica registrada antes de la salida", exitEvent.status === 201 && exitRegistration.status === 201 && exitAttendance.status === 200 && exitEventCompleted.status === 200);
  const exitBody = { requesterId: exitId, response: "Responsabilidades revisadas y salida ejecutada en prueba aislada" };
  check("I-21: salida aprobada bloqueada por responsabilidad pendiente", (await coord.call("POST", `/administrative-requests/${exitRequest.json.id}/withdrawal`, exitBody)).status === 409 &&
    (await coord.call("GET", `/administrative-requests/${exitRequest.json.id}/withdrawal`)).json.total === 1 && (await exiting.call("GET", "/auth/me")).status === 200);
  check("I-21: reasignacion explicita permite ejecutar salida", (await coord.call("PATCH", `/projects/${projectId}/tasks/${exitTask.id}`, { assigneeId: coordId })).status === 200 &&
    (await coord.call("POST", `/administrative-requests/${exitRequest.json.id}/withdrawal`, exitBody)).status === 200);
  check("I-21: salida revoca sesion y conserva autoria y participacion previa", (await exiting.call("GET", "/auth/me")).status === 401 &&
    (await coord.call("GET", `/academic-products/${exitProduct.json.id}`)).json.authors.some(a => a.userId === exitId) &&
    (await coord.call("GET", `/projects/${projectId}`)).json.members.some(m => m.userId === exitId));
  const retainedResult = (await coord.call("GET", `/projects/${projectId}/research-results`)).json.items.find(r => r.id === exitResult.json.id);
  const retainedTask = (await coord.call("GET", `/projects/${projectId}/tasks?pageSize=100`)).json.items.find(t => t.id === exitDoneTask.id);
  check("I-22: salida conserva participante investigativo y responsable de tarea terminada", retainedResult?.participants.some(p => p.userId === exitId) && retainedTask?.assignee?.userId === exitId && retainedTask?.status === "done");
  check("I-22: salida conserva asistencia y rol historico de actividad", (await coord.call("GET", `/events/${exitEvent.json.id}/participants`)).json.items.some(p => p.userId === exitId && p.role === "speaker" && p.attendance === "attended"));
  const retainedExitFile = await coord.download(exitDocument.json.id);
  check("I-22: autoridad conserva soporte integro y otro integrante no lo obtiene", retainedExitFile.status === 200 && sha(retainedExitFile.body) === sha(exitContent) && (await student.download(exitDocument.json.id)).status === 404);
  const exitHistory = await coord.call("GET", `/administrative-requests/${exitRequest.json.id}/history`);
  check("I-22: decision original y ejecucion permanecen separadas en el historial", exitHistory.json.total === 5 &&
    exitHistory.json.items.some(e => e.details?.to === "approved" && e.details.response === "Salida aprobada en prueba aislada" && e.actor?.id === coordId) &&
    exitHistory.json.items.filter(e => e.action === "administrative_request.withdrawal_executed" && e.actor?.id === coordId).length === 1);
  check("I-22: una salida completada no se ejecuta otra vez ni pierde su adjunto", (await coord.call("POST", `/administrative-requests/${exitRequest.json.id}/withdrawal`, exitBody)).status === 409 &&
    (await coord.call("DELETE", `/documents/${exitDocument.json.id}`)).status === 409);
  await stopServer(); await startServer();
  check("I-21: desvinculacion completada y revocacion persisten tras reiniciar", (await coord.call("GET", `/administrative-requests/${exitRequest.json.id}`)).json.status === "completed" &&
    (await exiting.call("GET", "/auth/me")).status === 401);
  check("I-22: historia investigativa, tarea y asistencia de persona inactiva persisten al reiniciar",
    (await coord.call("GET", `/projects/${projectId}/research-results`)).json.items.some(r => r.id === exitResult.json.id && r.participants.some(p => p.userId === exitId)) &&
    (await coord.call("GET", `/projects/${projectId}/tasks?pageSize=100`)).json.items.some(t => t.id === exitDoneTask.id && t.assignee?.userId === exitId && t.status === "done") &&
    (await coord.call("GET", `/events/${exitEvent.json.id}/participants`)).json.items.some(p => p.userId === exitId && p.attendance === "attended"));

  // I-25: pantallas sin datos (criterio F6): sin porcentajes engañosos ni errores.
  const emptyProject = await coord.call("POST", "/projects", { name: "Proyecto vacio E2E", type: "internal", methodology: "traditional" });
  const emptyPage = await coord.page(`/hub/proyectos/${emptyProject.json.id}/seguimiento`);
  check("I-25: proyecto sin datos muestra 'Sin tareas' y estados vacios, sin porcentajes ni errores", emptyProject.status === 201 && emptyPage.status === 200 &&
    emptyPage.html.includes("Sin tareas") && emptyPage.html.includes("Aún no hay observaciones registradas.") && emptyPage.html.includes("Sin datos registrados.") &&
    !/\d+ %|NaN|undefined/.test(emptyPage.html.replace(/<script[\s\S]*?<\/script>/g, "")), { status: emptyPage.status });
  const emptyReport = await coord.page("/hub/reportes?reporte=produccion&desde=1990-01-01&hasta=1990-01-02");
  check("I-25: reporte sin resultados lo indica sin romper la pagina", emptyReport.status === 200 &&
    emptyReport.html.includes("Sin resultados para los filtros actuales.") && emptyReport.html.includes("Sin datos registrados."));

  // I-23: paneles de seguimiento sobre el entorno acumulado; el institucional se compara despues con SQLite.
  const trackingPanel = await coord.call("GET", "/tracking/institutional");
  check("I-23: autoridad consulta el panel institucional", trackingPanel.status === 200 && trackingPanel.json.tasks.total > 0, trackingPanel);
  check("I-23: integrantes sin autoridad no consultan el panel institucional",
    (await student.call("GET", "/tracking/institutional")).status === 403 && (await outsider.call("GET", "/tracking/institutional")).status === 403);
  const projectPanel = await student.call("GET", `/tracking/projects/${projectId}`);
  check("I-23: panel de proyecto coincide con sus tareas y la persona ajena recibe 404", projectPanel.status === 200 &&
    projectPanel.json.tasks.total === (await student.call("GET", `/projects/${projectId}/tasks?pageSize=100`)).json.total &&
    (await outsider.call("GET", `/tracking/projects/${projectId}`)).status === 404, projectPanel);
  const personalPanel = await student.call("GET", "/tracking/me");
  check("I-23: panel personal muestra solo proyectos propios", personalPanel.status === 200 &&
    personalPanel.json.projects.items.some(p => p.id === projectId) && !(await outsider.call("GET", "/tracking/me")).json.projects.items.some(p => p.id === projectId));
  check("I-23: paginas SSR de seguimiento respetan permisos",
    (await coord.page("/hub/seguimiento")).html.includes("Panel institucional") && (await student.page("/hub/seguimiento")).status === 404 &&
    (await student.page(`/hub/proyectos/${projectId}/seguimiento`)).html.includes("Avance de tareas") &&
    (await outsider.page(`/hub/proyectos/${projectId}/seguimiento`)).status === 404 && (await student.page("/hub")).html.includes("Mis tareas abiertas"));

  // I-24: observaciones de seguimiento y reportes filtrables.
  const observation = await coord.call("POST", `/projects/${projectId}/observations`, { kind: "progress", body: "Avance ficticio registrado por la prueba E2E." });
  check("I-24: autoridad registra observacion y el miembro la consulta sin poder registrar", observation.status === 201 &&
    (await student.call("GET", `/projects/${projectId}/observations`)).json.items.some(o => o.id === observation.json.id) &&
    (await student.call("POST", `/projects/${projectId}/observations`, { kind: "general", body: "Intento sin permiso de registro." })).status === 403 &&
    (await outsider.call("GET", `/projects/${projectId}/observations`)).status === 404, observation);
  check("I-24: la observacion aparece en la pagina de seguimiento del proyecto",
    (await student.page(`/hub/proyectos/${projectId}/seguimiento`)).html.includes("Avance ficticio registrado por la prueba E2E."));
  const projectReport = await coord.call("GET", "/tracking/reports/projects?pageSize=100");
  check("I-24: reportes solo para autoridades y validan el rango de fechas", projectReport.status === 200 &&
    (await coord.call("GET", "/tracking/reports/events?from=2026-05-01&to=2026-04-01")).status === 400 &&
    (await student.call("GET", "/tracking/reports/products")).status === 403 && (await outsider.call("GET", "/tracking/reports/events")).status === 403, projectReport);
  check("I-24: paginas SSR de reportes respetan permisos",
    (await coord.page("/hub/reportes?reporte=actividades")).html.includes("Actividades filtradas") &&
    (await coord.page("/hub/reportes?reporte=produccion&desde=2026-05-01&hasta=2026-04-01")).html.includes("Revisa los filtros") &&
    (await student.page("/hub/reportes")).status === 404);

  await stopServer();
  const requireBackend = createRequire(join(backendDir, "package.json"));
  const Database = requireBackend("better-sqlite3");
  const database = new Database(env.SQLITE_PATH, { readonly: true });
  try {
    check("SQLite conserva su integridad fisica", database.pragma("integrity_check", { simple: true }) === "ok");
    check("no hay relaciones huerfanas en SQLite", database.pragma("foreign_key_check").length === 0);
    const attendanceAudits = database.prepare("SELECT actor_user_id FROM audit_events WHERE target_id = ? AND action = 'event.attendance_changed'").all(activity.json.id);
    check("I-19: el unico cambio de asistencia confirmado pertenece a la autoridad",
      attendanceAudits.length === 1 && attendanceAudits[0].actor_user_id === coordId);
    const requestAttachments = database.prepare("SELECT rd.document_id, d.access_level FROM administrative_request_documents rd JOIN documents d ON d.id = rd.document_id").all();
    check("I-22: cada adjunto de tramite conserva metadatos privados y no tiene autorizaciones externas",
      requestAttachments.length === 2 && requestAttachments.every(d => d.access_level === "private") &&
      database.prepare("SELECT count(*) AS n FROM document_grants g JOIN administrative_request_documents rd ON rd.document_id = g.document_id").get().n === 0);
    const count = (sql) => database.prepare(sql).get().n;
    check("I-23: panel institucional coincide con conteos directos en SQLite",
      trackingPanel.json.members.active === count("SELECT count(*) AS n FROM users WHERE account_status = 'active'") &&
      trackingPanel.json.projects.total === count("SELECT count(*) AS n FROM projects") &&
      trackingPanel.json.tasks.total === count("SELECT count(*) AS n FROM tasks") &&
      trackingPanel.json.tasks.done === count("SELECT count(*) AS n FROM tasks WHERE status = 'done'") &&
      trackingPanel.json.events.completed === count("SELECT count(*) AS n FROM events WHERE status = 'completed'") &&
      trackingPanel.json.events.attendances === count("SELECT count(*) AS n FROM event_participants WHERE attendance = 'attended'") &&
      trackingPanel.json.products.total === count("SELECT count(*) AS n FROM academic_products"), trackingPanel.json);
    check("I-24: reporte de proyectos sin filtros coincide con SQLite y la observacion persiste",
      projectReport.json.summary.total === count("SELECT count(*) AS n FROM projects") &&
      projectReport.json.summary.tasks.total === count("SELECT count(*) AS n FROM tasks") &&
      count("SELECT count(*) AS n FROM project_observations") === 1, projectReport.json.summary);
    const records = database.prepare("SELECT storage_key, size_bytes, sha256 FROM documents").all();
    const files = await readdir(env.DOCUMENTS_DIR);
    check("seis cargas validas producen seis archivos, sin duplicados ni residuos de rechazos", records.length === 6 &&
      files.length === records.length && records.every((record) => files.includes(record.storage_key)));
    const contents = await Promise.all(records.map((record) => readFile(join(env.DOCUMENTS_DIR, record.storage_key))));
    check("cada archivo coincide con el tamano y SHA-256 de sus metadatos", records.every((record, index) =>
      contents[index].length === record.size_bytes && sha(contents[index]) === record.sha256));
  } finally {
    database.close();
  }

  if (process.argv.includes("--review")) {
    // Misma base ficticia de E2E, sin acceso a datos ni correo reales.
    const reviewFile = join(workDir, "i16-revision.pdf");
    await writeFile(reviewFile, pdf(4096, "revision manual I-16"));
    await startServer();
    console.log(`\nRevision manual: ${ORIGIN}/ingresar`);
    console.log(`Investigacion: ${ORIGIN}/hub/proyectos/${projectId}/investigacion`);
    console.log(`Documentos: ${ORIGIN}/hub/proyectos/${projectId}/documentos`);
    console.log(`Produccion: ${ORIGIN}/hub/proyectos/${projectId}/produccion`);
    console.log(`Actividades: ${ORIGIN}/hub/proyectos/${projectId}/actividades?mes=2026-10`);
    console.log(`Panel personal: ${ORIGIN}/hub`);
    console.log(`Panel institucional (autoridades): ${ORIGIN}/hub/seguimiento`);
    console.log(`Seguimiento del proyecto: ${ORIGIN}/hub/proyectos/${projectId}/seguimiento`);
    console.log(`Reportes (autoridades): ${ORIGIN}/hub/reportes`);
    console.log(`Tramites propios: ${ORIGIN}/hub/tramites`);
    console.log(`Bandeja de revision: ${ORIGIN}/hub/tramites?vista=review`);
    console.log(`Detalle del tramite: ${ORIGIN}/hub/tramites/${administrative.json.id}`);
    console.log(`Salida completada (solo autoridades): ${ORIGIN}/hub/tramites/${exitRequest.json.id}`);
    console.log(`Documento restringido: ${ORIGIN}/api/v1/documents/${restrictedDoc.json.id}/download`);
    console.log(`Documento privado: ${ORIGIN}/api/v1/documents/${privateDoc.json.id}/download`);
    console.log(`Archivo ficticio para probar el selector: ${reviewFile}`);
    console.log("Usa solo las cuentas ficticias definidas en este script; no guardes sus claves en el navegador.");
    console.log("Pulsa Enter al terminar. Cierre automatico en 15 minutos; se eliminaran base, outbox y archivos temporales.");
    await new Promise((resolveReview) => {
      const finish = () => {
        clearTimeout(timer);
        process.stdin.removeListener("data", finish);
        process.stdin.removeListener("end", finish);
        process.stdin.removeListener("close", finish);
        process.removeListener("SIGINT", finish);
        process.stdin.pause();
        resolveReview();
      };
      const timer = setTimeout(finish, 15 * 60 * 1000);
      process.stdin.once("data", finish);
      process.stdin.once("end", finish);
      process.stdin.once("close", finish);
      process.once("SIGINT", finish);
      process.stdin.resume();
    });
  }
}

try {
  await main();
  console.log(`\nE2E: ${passed} comprobaciones OK`);
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : error}`);
  console.error(`(${passed} comprobaciones OK antes del fallo)`);
  if (webLogs) console.error(`\nRegistro del frontend:\n${webLogs.split("\n").slice(-40).join("\n")}`);
  process.exitCode = 1;
} finally {
  await stopProcess(web);
  await stopServer();
  await rm(workDir, { recursive: true, force: true });
}
