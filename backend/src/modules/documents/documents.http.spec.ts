import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import { docxFixture, pdfFixture, pngFixture } from "../../testing/file-fixtures";
import { type HttpHarness, ORIGIN, startHttpHarness } from "../../testing/http-harness";
import { AuditEvent } from "../audit/audit-event.entity";
import type { RoleCode } from "../roles/role.entity";
import { User } from "../users/user.entity";

const MAX_BYTES = 64 * 1024;

let h: HttpHarness;
let documentsDir: string;
let counter = 0;

type Session = { cookies: string[]; csrf: string; id: string };

async function person(roles: RoleCode[]): Promise<Session> {
  counter += 1;
  const email = `documento-${counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles });
  return { ...(await h.loginOk(email)), id: user.id };
}

function send(session: Session, method: string, path: string, body?: unknown) {
  return h.request(path, { method, cookies: session.cookies, csrf: session.csrf, body });
}

/** Carga `multipart/form-data` con la sesion indicada. */
async function upload(
  session: Session,
  path: string,
  file: { content: Buffer; name: string } | null,
  fields: Record<string, string> = {},
) {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }

  if (file) {
    form.append("file", new Blob([new Uint8Array(file.content)]), file.name);
  }

  const response = await fetch(`${h.baseUrl}/api/v1${path}`, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      Cookie: session.cookies.join("; "),
      "X-CSRF-Token": session.csrf,
      "X-Forwarded-For": `203.0.113.1, ${h.freshIp()}`,
    },
    body: form,
  });
  const text = await response.text();
  return { response, text, json: text ? JSON.parse(text) : null };
}

async function download(session: Session, id: string) {
  const response = await fetch(`${h.baseUrl}/api/v1/documents/${id}/download`, {
    headers: { Origin: ORIGIN, Cookie: session.cookies.join("; "), "X-Forwarded-For": `203.0.113.1, ${h.freshIp()}` },
  });
  return { response, body: Buffer.from(await response.arrayBuffer()) };
}

/** Proyecto del coordinador (lider) con un lider y dos colaboradores. */
async function team() {
  const coordinator = await person(["coordinator"]);
  const leader = await person(["teacher_leader"]);
  const collaborator = await person(["student"]);
  const colleague = await person(["researcher"]);
  const created = await send(coordinator, "POST", "/projects", { name: "Proyecto con documentos", type: "research", methodology: "traditional" });
  assert.equal(created.response.status, 201, created.text);
  const projectId = created.json.id as string;

  for (const [member, role] of [
    [leader, "leader"],
    [collaborator, "collaborator"],
    [colleague, "collaborator"],
  ] as const) {
    const added = await send(coordinator, "POST", `/projects/${projectId}/members`, { userId: member.id, role });
    assert.equal(added.response.status, 201, added.text);
  }

  return { coordinator, leader, collaborator, colleague, projectId };
}

async function uploadOk(session: Session, path: string, fields: Record<string, string> = {}, file = { content: pdfFixture(), name: "Informe.pdf" }) {
  const result = await upload(session, path, file, fields);
  assert.equal(result.response.status, 201, result.text);
  return result.json as { id: string; accessLevel: string; title: string; grantedUsers?: { userId: string }[] };
}

before(async () => {
  documentsDir = await mkdtemp(join(tmpdir(), "alfacode-documents-"));
  h = await startHttpHarness({ env: { DOCUMENTS_DIR: documentsDir, DOCUMENT_MAX_BYTES: String(MAX_BYTES), STORAGE_DRIVER: "local" } });
});

after(async () => {
  await h?.close();
  await rm(documentsDir, { recursive: true, force: true });
});

describe("carga y descarga (F3-05, F3-07)", () => {
  it("un integrante sube un PDF; se guarda con clave aleatoria y se descarga igual", async () => {
    const { collaborator, projectId } = await team();
    const content = pdfFixture("contenido de prueba");

    const created = await upload(collaborator, `/projects/${projectId}/documents`, { content, name: "../../Acta de reunión.pdf" }, {
      category: "minutes",
      description: "Acta",
    });
    assert.equal(created.response.status, 201, created.text);
    assert.equal(created.json.originalName, "Acta de reunión.pdf");
    assert.equal(created.json.title, "Acta de reunión");
    assert.equal(created.json.mimeType, "application/pdf");
    assert.equal(created.json.sizeBytes, content.length);
    assert.equal(created.json.accessLevel, "restricted");
    assert.equal(created.json.storageKey, undefined);

    const files = await readdir(documentsDir);
    assert.ok(files.every((file) => /^[0-9a-f-]{36}$/.test(file)), files.join());

    const { response, body } = await download(collaborator, created.json.id);
    assert.equal(response.status, 200);
    assert.ok(body.equals(content), `${body.length} ${content.length} ${JSON.stringify(body.subarray(0, 80).toString("latin1"))}`);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    assert.match(response.headers.get("content-disposition") ?? "", /^attachment; filename="Acta de reunion.pdf"/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy") ?? "", /sandbox/);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  it("acepta Word y PNG validos", async () => {
    const { leader, projectId } = await team();
    await uploadOk(leader, `/projects/${projectId}/documents`, {}, { content: docxFixture(), name: "Propuesta.docx" });
    await uploadOk(leader, `/projects/${projectId}/documents`, { category: "evidence" }, { content: pngFixture(), name: "foto.PNG" });
  });

  it("rechaza archivos demasiado grandes, tipos no permitidos y contenido incoherente sin guardar nada", async () => {
    const { leader, projectId } = await team();
    const before = (await readdir(documentsDir)).length;

    const tooLarge = await upload(leader, `/projects/${projectId}/documents`, { content: Buffer.concat([pdfFixture(), Buffer.alloc(MAX_BYTES)]), name: "grande.pdf" });
    assert.equal(tooLarge.response.status, 413, tooLarge.text);

    const exactlyOver = await upload(leader, `/projects/${projectId}/documents`, {
      content: Buffer.concat([pdfFixture(), Buffer.alloc(MAX_BYTES + 1 - pdfFixture().length)]),
      name: "limite.pdf",
    });
    assert.equal(exactlyOver.response.status, 413, exactlyOver.text);
    assert.equal(exactlyOver.json.code, "FILE_TOO_LARGE");

    for (const name of ["pagina.html", "imagen.svg", "programa.exe", "comprimido.zip", "sin-extension"]) {
      const { response, json } = await upload(leader, `/projects/${projectId}/documents`, { content: pdfFixture(), name });
      assert.equal(response.status, 415, name);
      assert.equal(json.code, "UNSUPPORTED_FILE_TYPE");
    }

    for (const file of [
      { content: Buffer.from("<html><script>alert(1)</script></html>"), name: "falso.pdf" },
      { content: pdfFixture(), name: "falsa.png" },
      { content: pngFixture(), name: "falso.docx" },
      { content: docxFixture({ "word/vbaProject.bin": "macro" }), name: "macros.docx" },
    ]) {
      const { response, json } = await upload(leader, `/projects/${projectId}/documents`, file);
      assert.equal(response.status, 415, file.name);
      assert.equal(json.code, "FILE_CONTENT_MISMATCH");
    }

    const missing = await upload(leader, `/projects/${projectId}/documents`, null, { title: "Sin archivo" });
    assert.equal(missing.response.status, 400);
    assert.equal(missing.json.code, "FILE_REQUIRED");

    const badFields = await upload(leader, `/projects/${projectId}/documents`, { content: pdfFixture(), name: "x.pdf" }, { accessLevel: "public" });
    assert.equal(badFields.response.status, 400);
    const extraField = await upload(leader, `/projects/${projectId}/documents`, { content: pdfFixture(), name: "x.pdf" }, { storageKey: "../x" });
    assert.equal(extraField.response.status, 400);

    assert.equal((await readdir(documentsDir)).length, before);
  });

  it("la carga exige sesion, CSRF y origen permitido", async () => {
    const { leader, projectId } = await team();
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(pdfFixture())]), "x.pdf");

    const anonymous = await fetch(`${h.baseUrl}/api/v1/projects/${projectId}/documents`, { method: "POST", headers: { Origin: ORIGIN }, body: form });
    assert.equal(anonymous.status, 401);

    const noCsrf = await fetch(`${h.baseUrl}/api/v1/projects/${projectId}/documents`, {
      method: "POST",
      headers: { Origin: ORIGIN, Cookie: leader.cookies.join("; ") },
      body: form,
    });
    assert.equal(noCsrf.status, 403);
  });
});

describe("permisos documentales (F3-08, DEC-029)", () => {
  it("restringido: solo el equipo y las autoridades; un ajeno recibe 404 sin contenido", async () => {
    const { coordinator, collaborator, colleague, projectId } = await team();
    const outsider = await person(["teacher_leader"]);
    const document = await uploadOk(collaborator, `/projects/${projectId}/documents`);

    assert.equal((await send(colleague, "GET", `/documents/${document.id}`)).response.status, 200);
    assert.equal((await download(colleague, document.id)).response.status, 200);
    assert.equal((await download(coordinator, document.id)).response.status, 200);

    const detail = await send(outsider, "GET", `/documents/${document.id}`);
    assert.equal(detail.response.status, 404);
    assert.equal(detail.json.code, "DOCUMENT_NOT_FOUND");
    const blocked = await download(outsider, document.id);
    assert.equal(blocked.response.status, 404);
    assert.ok(!blocked.body.includes(Buffer.from("%PDF")));
    assert.equal((await send(outsider, "GET", `/projects/${projectId}/documents`)).response.status, 404);
    const repository = await send(outsider, "GET", "/documents");
    assert.ok(!repository.json.items.some((item: { id: string }) => item.id === document.id));
  });

  it("general: cualquier integrante del semillero lo ve y lo encuentra en el repositorio", async () => {
    const { leader, projectId } = await team();
    const outsider = await person(["student"]);
    const document = await uploadOk(leader, `/projects/${projectId}/documents`, { accessLevel: "general", title: `General ${randomUUID()}` });

    assert.equal((await download(outsider, document.id)).response.status, 200);
    const repository = await send(outsider, "GET", `/documents?q=${encodeURIComponent(document.title)}`);
    assert.deepEqual(repository.json.items.map((item: { id: string }) => item.id), [document.id]);
    assert.equal(repository.json.items[0].permissions.canEdit, false);
  });

  it("privado: dueno, autorizados y autoridades; ni el lider ni el equipo sin autorizacion", async () => {
    const { coordinator, leader, collaborator, colleague, projectId } = await team();
    const admin = await person(["admin"]);
    const document = await uploadOk(collaborator, `/projects/${projectId}/documents`, {
      accessLevel: "private",
      grantedUserIds: colleague.id,
    });
    assert.deepEqual(document.grantedUsers?.map((user) => user.userId), [colleague.id]);

    for (const allowed of [collaborator, colleague, coordinator, admin]) {
      assert.equal((await download(allowed, document.id)).response.status, 200);
    }

    assert.equal((await download(leader, document.id)).response.status, 404);
    const leaderList = await send(leader, "GET", `/projects/${projectId}/documents`);
    assert.ok(!leaderList.json.items.some((item: { id: string }) => item.id === document.id));
    assert.equal((await send(leader, "PATCH", `/documents/${document.id}`, { title: "Cambio" })).response.status, 404);

    // La persona autorizada lo ve, pero no ve a quien mas se autorizo ni lo gestiona.
    const asGrantee = await send(colleague, "GET", `/documents/${document.id}`);
    assert.equal(asGrantee.json.grantedUsers, undefined);
    assert.equal((await send(colleague, "DELETE", `/documents/${document.id}`)).response.status, 403);

    // Retirar la autorizacion la quita de inmediato.
    const revoked = await send(collaborator, "PATCH", `/documents/${document.id}`, { grantedUserIds: [] });
    assert.equal(revoked.response.status, 200, revoked.text);
    assert.equal((await download(colleague, document.id)).response.status, 404);
  });

  it("las autorizaciones solo existen en documentos privados y para integrantes activos", async () => {
    const { leader, collaborator, projectId } = await team();
    const inactive = await person(["student"]);
    await h.dataSource.getRepository(User).update({ id: inactive.id }, { accountStatus: "inactive" });

    const notPrivate = await upload(leader, `/projects/${projectId}/documents`, { content: pdfFixture(), name: "x.pdf" }, {
      accessLevel: "restricted",
      grantedUserIds: collaborator.id,
    });
    assert.equal(notPrivate.response.status, 400);

    for (const userId of [inactive.id, randomUUID()]) {
      const { response, json } = await upload(leader, `/projects/${projectId}/documents`, { content: pdfFixture(), name: "x.pdf" }, {
        accessLevel: "private",
        grantedUserIds: userId,
      });
      assert.equal(response.status, 409);
      assert.equal(json.code, "GRANTEE_NOT_ACTIVE");
    }

    const document = await uploadOk(leader, `/projects/${projectId}/documents`, { accessLevel: "private", grantedUserIds: collaborator.id });
    const opened = await send(leader, "PATCH", `/documents/${document.id}`, { accessLevel: "restricted" });
    assert.equal(opened.response.status, 200, opened.text);
    const rows = await h.dataSource.query("SELECT COUNT(*) AS count FROM document_grants WHERE document_id = ?", [document.id]);
    assert.equal(Number(rows[0].count), 0);
  });

  it("gestionan quien lo subio, el lider y las autoridades; el resto del equipo no", async () => {
    const { leader, collaborator, colleague, projectId } = await team();
    const document = await uploadOk(collaborator, `/projects/${projectId}/documents`);

    assert.equal((await send(colleague, "PATCH", `/documents/${document.id}`, { title: "Cambio ajeno" })).response.status, 403);
    assert.equal((await send(colleague, "DELETE", `/documents/${document.id}`)).response.status, 403);

    const byLeader = await send(leader, "PATCH", `/documents/${document.id}`, { title: "Informe final", category: "report", description: null });
    assert.equal(byLeader.response.status, 200, byLeader.text);
    assert.equal(byLeader.json.title, "Informe final");

    const byOwner = await send(collaborator, "PATCH", `/documents/${document.id}`, { accessLevel: "general" });
    assert.equal(byOwner.json.accessLevel, "general");

    for (const body of [{ title: "ab" }, { accessLevel: "public" }, { category: "secret" }, { storageKey: "x" }, { projectId: randomUUID() }]) {
      const { response } = await send(leader, "PATCH", `/documents/${document.id}`, body);
      assert.equal(response.status, 400, JSON.stringify(body));
    }
  });

  it("eliminar borra metadatos y archivo y queda auditado", async () => {
    const { leader, projectId } = await team();
    const document = await uploadOk(leader, `/projects/${projectId}/documents`);
    const before = (await readdir(documentsDir)).length;

    assert.equal((await send(leader, "DELETE", `/documents/${document.id}`)).response.status, 204);
    assert.equal((await send(leader, "GET", `/documents/${document.id}`)).response.status, 404);
    assert.equal((await readdir(documentsDir)).length, before - 1);

    const events = await h.dataSource.getRepository(AuditEvent).findBy({ targetId: document.id });
    assert.deepEqual(events.map((event) => event.action).sort(), ["document.deleted", "document.uploaded"]);
  });

  it("un proyecto finalizado queda en solo lectura, pero sus documentos se siguen descargando", async () => {
    const { coordinator, leader, projectId } = await team();
    const document = await uploadOk(leader, `/projects/${projectId}/documents`);
    await send(coordinator, "POST", `/projects/${projectId}/status`, { status: "cancelled", reason: "Prueba" });

    const blocked = await upload(leader, `/projects/${projectId}/documents`, { content: pdfFixture(), name: "x.pdf" });
    assert.equal(blocked.response.status, 409);
    assert.equal(blocked.json.code, "PROJECT_NOT_EDITABLE");
    assert.equal((await send(leader, "PATCH", `/documents/${document.id}`, { title: "Cambio" })).response.status, 409);
    assert.equal((await send(leader, "DELETE", `/documents/${document.id}`)).response.status, 409);
    assert.equal((await download(leader, document.id)).response.status, 200);
  });
});

describe("repositorio institucional y resultados (F3-05, F3-09)", () => {
  it("solo la coordinacion sube al repositorio institucional; restringido solo lo ven autoridades", async () => {
    const coordinator = await person(["coordinator"]);
    const teacher = await person(["teacher_leader"]);
    const student = await person(["student"]);

    const denied = await upload(teacher, "/documents", { content: pdfFixture(), name: "acta.pdf" });
    assert.equal(denied.response.status, 403);

    const general = await uploadOk(coordinator, "/documents", { category: "certificate", title: `Formato ${randomUUID()}` });
    assert.equal(general.accessLevel, "general");
    const restricted = await uploadOk(coordinator, "/documents", { accessLevel: "restricted" });

    assert.equal((await download(student, general.id)).response.status, 200);
    assert.equal((await download(student, restricted.id)).response.status, 404);

    const repository = await send(student, "GET", "/documents?scope=institutional&category=certificate");
    assert.ok(repository.json.items.some((item: { id: string }) => item.id === general.id));
    assert.equal(repository.json.permissions.canUploadInstitutional, false);
  });

  it("un documento se vincula a un resultado del mismo proyecto, no de otro", async () => {
    const first = await team();
    const second = await team();
    const result = await send(first.leader, "POST", `/projects/${first.projectId}/research-results`, { title: "Resultado con evidencia" });
    const foreign = await send(second.leader, "POST", `/projects/${second.projectId}/research-results`, { title: "Resultado ajeno" });

    const linked = await uploadOk(first.leader, `/projects/${first.projectId}/documents`, { researchResultId: result.json.id, category: "evidence" });
    const filtered = await send(first.leader, "GET", `/projects/${first.projectId}/documents?researchResultId=${result.json.id}`);
    assert.deepEqual(filtered.json.items.map((item: { id: string }) => item.id), [linked.id]);
    assert.equal(filtered.json.items[0].researchResult.title, "Resultado con evidencia");

    const crossed = await upload(first.leader, `/projects/${first.projectId}/documents`, { content: pdfFixture(), name: "x.pdf" }, {
      researchResultId: foreign.json.id,
    });
    assert.equal(crossed.response.status, 404);
    assert.equal(crossed.json.code, "RESEARCH_RESULT_NOT_FOUND");

    // La base de datos tambien lo impide aunque se salte la API.
    await assert.rejects(
      h.dataSource.query("UPDATE documents SET research_result_id = ? WHERE id = ?", [foreign.json.id, linked.id]),
      /FOREIGN KEY/,
    );

    // Al eliminar el resultado, el documento sigue en el proyecto sin el vinculo.
    assert.equal((await send(first.leader, "DELETE", `/projects/${first.projectId}/research-results/${result.json.id}`)).response.status, 204);
    const after = await send(first.leader, "GET", `/documents/${linked.id}`);
    assert.equal(after.response.status, 200);
    assert.equal(after.json.researchResult, null);
  });
});

describe("sin almacenamiento configurado (DEC-029)", () => {
  it("el modulo responde 503 y no acepta cargas", async () => {
    const disabled = await startHttpHarness({ env: { STORAGE_DRIVER: "none" } });

    try {
      const email = `sin-almacenamiento-${randomUUID()}@uniguajira.edu.co`;
      await disabled.createUser(email, { roles: ["coordinator"] });
      const session = await disabled.loginOk(email);
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array(pdfFixture())]), "x.pdf");
      const response = await fetch(`${disabled.baseUrl}/api/v1/documents`, {
        method: "POST",
        headers: { Origin: ORIGIN, Cookie: session.cookies.join("; "), "X-CSRF-Token": session.csrf },
        body: form,
      });
      assert.equal(response.status, 503);
      assert.equal((await response.json()).code, "STORAGE_NOT_CONFIGURED");
    } finally {
      await disabled.close();
    }
  });
});
