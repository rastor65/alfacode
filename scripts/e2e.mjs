// Prueba E2E del HUB: cierre de la Fase 2 (pruebas F2 #9, #11 en SQLite y #12), investigacion
// (I-14) y documentos (I-15) de la Fase 3, por API y con las paginas renderizadas por Next.js.
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
  const academicPayload = { title: "Articulo E2E del tutor", type: "article", status: "submitted", projectId,
    authors: [{ userId: studentId }, { externalName: "Colaboradora externa ficticia" }], resultIds: [result.json.id], productDate: "2026-10-18" };
  const academic = await coord.call("POST", "/academic-products", academicPayload);
  check("I-17: producto con autoria interna, externa y resultado del proyecto", academic.status === 201 && academic.json.authors?.length === 2 && academic.json.results?.[0]?.id === result.json.id, academic);
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

  await stopServer();
  const requireBackend = createRequire(join(backendDir, "package.json"));
  const Database = requireBackend("better-sqlite3");
  const database = new Database(env.SQLITE_PATH, { readonly: true });
  try {
    check("SQLite conserva su integridad fisica", database.pragma("integrity_check", { simple: true }) === "ok");
    check("no hay relaciones huerfanas en SQLite", database.pragma("foreign_key_check").length === 0);
    const records = database.prepare("SELECT storage_key, size_bytes, sha256 FROM documents").all();
    const files = await readdir(env.DOCUMENTS_DIR);
    check("cuatro cargas validas producen cuatro archivos, sin duplicados ni residuos de rechazos", records.length === 4 &&
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
