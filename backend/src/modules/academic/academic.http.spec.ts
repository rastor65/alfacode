import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { startHttpHarness, type HttpHarness } from "../../testing/http-harness";
import { AuditEvent } from "../audit/audit-event.entity";
import { AcademicProductResult, ProductAuthor } from "./academic.entities";
import { pdfFixture } from "../../testing/file-fixtures";
import { Project } from "../projects/project.entity";
let h: HttpHarness;
let documentsDir: string;
let count = 0;
type Session = { cookies: string[]; csrf: string; id: string };
async function person(authority = false) {
  const email = `academico-${++count}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles: [authority ? "coordinator" : "student"] });
  return { ...await h.loginOk(email), id: user.id };
}
const send = (s: Session, method: string, path: string, body?: unknown) => h.request(path, { method, body, cookies: s.cookies, csrf: s.csrf });
const product = (userId: string, extra: Record<string, unknown> = {}) => ({ title: "Producto de prueba", type: "article", status: "in_progress", authors: [{ userId }, { externalName: "Persona externa" }], ...extra });
async function team() {
  const coord = await person(true), leader = await person(), member = await person(), outsider = await person();
  const p = await send(coord, "POST", "/projects", { name: "Proyecto academico", type: "research", methodology: "traditional" });
  assert.equal(p.response.status, 201, p.text);
  for (const [user, role] of [[leader, "leader"], [member, "collaborator"]] as const) {
    assert.equal((await send(coord, "POST", `/projects/${p.json.id}/members`, { userId: user.id, role })).response.status, 201);
  }
  return { coord, leader, member, outsider, projectId: p.json.id as string };
}
before(async () => { documentsDir = await mkdtemp(join(tmpdir(), "alfacode-academic-test-")); h = await startHttpHarness({ env: { DOCUMENTS_DIR: documentsDir, STORAGE_DRIVER: "local" } }); });
after(async () => { await h?.close(); if (documentsDir) await rm(documentsDir, { recursive: true, force: true }); });

describe("I-17: productos, autoria y permisos", () => {
  it("crea tipos previstos con autores ordenados, externos sin cuenta y datos opcionales", async () => {
    const coord = await person(true);
    const usersBefore = (await h.dataSource.query("SELECT count(*) AS n FROM users"))[0].n;
    for (const type of ["article", "presentation", "poster", "book_chapter", "book", "software", "other"]) {
      const created = await send(coord, "POST", "/academic-products", product(coord.id, { type, productDate: "2026-10-18", doi: "10.1234/ejemplo", url: "https://example.org/producto" }));
      assert.equal(created.response.status, 201, created.text);
      assert.deepEqual(created.json.authors.map((a: { position: number }) => a.position), [1, 2]);
      assert.equal(created.json.authors[1].externalName, "Persona externa");
      assert.equal(created.json.permissions.canManage, true);
    }
    assert.equal((await h.dataSource.query("SELECT count(*) AS n FROM users"))[0].n, usersBefore);
  });
  it("solo autoridad crea institucional; cualquier integrante consulta sin correos de autores", async () => {
    const coord = await person(true), student = await person();
    assert.equal((await send(student, "POST", "/academic-products", product(student.id))).response.status, 403);
    const created = await send(coord, "POST", "/academic-products", product(coord.id));
    const read = await send(student, "GET", `/academic-products/${created.json.id}`);
    assert.equal(read.response.status, 200);
    assert.equal(read.json.permissions.canManage, false);
    assert.equal(read.text.includes("@uniguajira"), false);
    assert.equal((await send(student, "PUT", `/academic-products/${created.json.id}`, product(student.id))).response.status, 403);
  });
  it("lider gestiona su proyecto; colaborador consulta; ajeno no ve detalle ni totales", async () => {
    const t = await team();
    const created = await send(t.leader, "POST", "/academic-products", product(t.member.id, { projectId: t.projectId }));
    assert.equal(created.response.status, 201, created.text);
    assert.equal((await send(t.member, "GET", `/academic-products/${created.json.id}`)).response.status, 200);
    for (const method of ["GET", "PUT", "DELETE"]) {
      const response = await send(t.outsider, method, `/academic-products/${created.json.id}`, method === "PUT" ? product(t.outsider.id) : undefined);
      assert.equal(response.response.status, 404, response.text);
    }
    assert.equal((await send(t.member, "PUT", `/academic-products/${created.json.id}`, product(t.member.id, { projectId: t.projectId }))).response.status, 403);
    const list = await send(t.outsider, "GET", `/academic-products?projectId=${t.projectId}`);
    assert.equal(list.json.total, 0);
    assert.deepEqual(list.json.items, []);
  });
  it("valida autores exclusivos, duplicados, anidados, inactivos y externos vacios", async () => {
    const coord = await person(true);
    for (const authors of [[], [{}], [{ userId: coord.id, externalName: "Externo" }], [{ userId: coord.id }, { userId: coord.id }], [{ externalName: " " }], [{ externalName: "Persona" }, { externalName: "Pérsona" }], [{ userId: coord.id, role: "admin" }], null]) {
      const result = await send(coord, "POST", "/academic-products", product(coord.id, { authors }));
      assert.equal(result.response.status, 400, result.text);
    }
    const inactive = await h.createUser(`inactivo-${++count}@uniguajira.edu.co`, { status: "inactive" });
    assert.equal((await send(coord, "POST", "/academic-products", product(inactive.id))).response.status, 400);
  });
  it("rechaza fecha imposible, URL peligrosa, DOI invalido y campos protegidos", async () => {
    const coord = await person(true);
    for (const fields of [{ productDate: "2026-02-30" }, { url: "javascript:alert(1)" }, { doi: "incorrecto" }, { status: "inventado" }, { type: null }, { title: null }, { createdBy: coord.id }]) {
      const response = await send(coord, "POST", "/academic-products", product(coord.id, fields));
      assert.equal(response.response.status, 400, response.text);
    }
  });
  it("asocia resultados del mismo proyecto y rechaza relaciones cruzadas por API y FK", async () => {
    const t = await team();
    const result = await send(t.leader, "POST", `/projects/${t.projectId}/research-results`, { title: "Hallazgo academico" });
    const saved = await send(t.leader, "POST", "/academic-products", product(t.member.id, { projectId: t.projectId, resultIds: [result.json.id] }));
    assert.equal(saved.response.status, 201, saved.text);
    assert.equal(saved.json.results[0].id, result.json.id);
    const other = await team();
    assert.equal((await send(t.coord, "POST", "/academic-products", product(other.member.id, { projectId: other.projectId, resultIds: [result.json.id] }))).response.status, 400);
    await assert.rejects(() => h.dataSource.manager.insert(AcademicProductResult, { productId: saved.json.id, resultId: result.json.id, projectId: other.projectId }));
    // No duplicar los datos de un resultado: borrarlo elimina solo el vinculo, no el producto.
    assert.equal((await send(t.leader, "DELETE", `/projects/${t.projectId}/research-results/${result.json.id}`)).response.status, 204);
    assert.deepEqual((await send(t.member, "GET", `/academic-products/${saved.json.id}`)).json.results, []);
  });
  it("conserva autorias al salir del equipo, reordena y elimina con auditoria", async () => {
    const t = await team();
    const created = await send(t.leader, "POST", "/academic-products", product(t.member.id, { projectId: t.projectId }));
    await send(t.coord, "DELETE", `/projects/${t.projectId}/members/${t.member.id}`);
    const updated = await send(t.leader, "PUT", `/academic-products/${created.json.id}`, product(t.member.id, { projectId: t.projectId, authors: [{ externalName: "Persona externa" }, { userId: t.member.id }] }));
    assert.equal(updated.response.status, 200, updated.text);
    assert.equal(updated.json.authors[1].userId, t.member.id);
    assert.equal((await send(t.leader, "DELETE", `/academic-products/${created.json.id}`)).response.status, 204);
    assert.equal(await h.dataSource.manager.countBy(ProductAuthor, { productId: created.json.id }), 0);
    const events = await h.dataSource.manager.findBy(AuditEvent, { targetId: created.json.id });
    assert.equal(events.length, 3);
  });
  it("filtra por autor, tipo y estado con paginacion; exige sesion y CSRF", async () => {
    const coord = await person(true);
    await send(coord, "POST", "/academic-products", product(coord.id, { title: "Producto filtrable", status: "published" }));
    const filtered = await send(coord, "GET", `/academic-products?authorId=${coord.id}&status=published&type=article&pageSize=1&q=filtrable`);
    assert.equal(filtered.json.total, 1);
    assert.equal(filtered.json.items.length, 1);
    assert.equal((await send(coord, "GET", `/academic-products?authorId=${coord.id}&q=%25`)).json.total, 0);
    assert.equal((await h.request("/academic-products")).response.status, 401);
    assert.equal((await h.request("/academic-products", { method: "POST", cookies: coord.cookies, body: product(coord.id) })).response.status, 403);
    assert.equal((await send(coord, "GET", "/academic-products?pageSize=101")).response.status, 400);
    assert.equal((await send(coord, "GET", `/academic-products/${randomUUID()}`)).response.status, 404);
  });
  it("un proyecto finalizado conserva historial y bloquea cambios academicos", async () => {
    const t = await team();
    const payload = product(t.member.id, { projectId: t.projectId });
    const saved = await send(t.leader, "POST", "/academic-products", payload);
    await h.dataSource.manager.update(Project, { id: t.projectId }, { status: "completed" });
    const read = await send(t.member, "GET", `/academic-products/${saved.json.id}`);
    assert.equal(read.response.status, 200);
    assert.equal(read.json.permissions.canManage, false);
    assert.equal((await send(t.coord, "PUT", `/academic-products/${saved.json.id}`, payload)).response.status, 409);
    assert.equal((await send(t.leader, "DELETE", `/academic-products/${saved.json.id}`)).response.status, 409);
    assert.equal((await send(t.coord, "POST", "/academic-products", payload)).response.status, 409);
  });
});

describe("I-17: reconocimientos", () => {
  it("la evidencia conserva permisos; ocultarla no elimina el reconocimiento y borrarla no lo borra", async () => {
    const t = await team();
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(pdfFixture())]), "Premio.pdf");
    form.append("accessLevel", "private");
    const uploaded = await fetch(`${h.baseUrl}/api/v1/projects/${t.projectId}/documents`, { method: "POST", body: form,
      headers: { Origin: "http://localhost:3000", Cookie: t.coord.cookies.join("; "), "X-CSRF-Token": t.coord.csrf, "X-Forwarded-For": h.freshIp() } });
    assert.equal(uploaded.status, 201);
    const document = await uploaded.json() as { id: string };
    const dto = { title: "Premio con documento privado", projectId: t.projectId, userId: t.member.id, recognitionDate: "2026-10-18", evidenceDocumentId: document.id };
    const saved = await send(t.coord, "POST", "/recognitions", dto);
    assert.equal(saved.response.status, 201, saved.text);
    const memberView = await send(t.member, "GET", `/recognitions/${saved.json.id}`);
    assert.equal(memberView.response.status, 200);
    assert.equal(memberView.json.evidence, null);
    assert.equal(memberView.text.includes(document.id), false);
    const inaccessible = await send(t.leader, "POST", "/recognitions", dto);
    assert.equal(inaccessible.response.status, 404, inaccessible.text);
    const other = await team();
    assert.equal((await send(t.coord, "POST", "/recognitions", { ...dto, projectId: other.projectId, userId: other.member.id })).response.status, 400);
    const second = await send(t.coord, "POST", "/recognitions", { ...dto, title: "Otra referencia al mismo archivo" });
    assert.equal((await send(t.coord, "DELETE", `/recognitions/${second.json.id}`)).response.status, 204);
    assert.equal((await send(t.coord, "GET", `/documents/${document.id}`)).response.status, 200);
    assert.equal((await send(t.coord, "DELETE", `/documents/${document.id}`)).response.status, 204);
    const retained = await send(t.coord, "GET", `/recognitions/${saved.json.id}`);
    assert.equal(retained.response.status, 200);
    assert.equal(retained.json.evidenceDocumentId, null);
  });
  it("registra reconocimiento personal con fecha y lo muestra solo al destinatario y autoridades", async () => {
    const coord = await person(true), recipient = await person(), outsider = await person();
    const saved = await send(coord, "POST", "/recognitions", { title: "Reconocimiento ficticio", userId: recipient.id, recognitionDate: "2026-10-18" });
    assert.equal(saved.response.status, 201, saved.text);
    assert.equal((await send(recipient, "GET", `/recognitions/${saved.json.id}`)).response.status, 200);
    assert.equal((await send(outsider, "GET", `/recognitions/${saved.json.id}`)).response.status, 404);
    assert.equal((await send(outsider, "PUT", `/recognitions/${saved.json.id}`, { title: "No autorizado", userId: outsider.id, recognitionDate: "2026-10-18" })).response.status, 404);
    assert.equal((await send(outsider, "DELETE", `/recognitions/${saved.json.id}`)).response.status, 404);
    assert.equal((await send(outsider, "GET", `/recognitions?authorId=${recipient.id}`)).json.total, 0);
  });
  it("lider registra reconocimiento del proyecto; colaborador no lo altera", async () => {
    const t = await team();
    const dto = { title: "Premio del proyecto", projectId: t.projectId, userId: t.member.id, recognitionDate: "2026-10-18" };
    const saved = await send(t.leader, "POST", "/recognitions", dto);
    assert.equal(saved.response.status, 201, saved.text);
    assert.equal((await send(t.member, "PUT", `/recognitions/${saved.json.id}`, dto)).response.status, 403);
    const updated = await send(t.leader, "PUT", `/recognitions/${saved.json.id}`, { ...dto, title: "Premio actualizado" });
    assert.equal(updated.response.status, 200, updated.text);
    assert.equal((await send(t.leader, "DELETE", `/recognitions/${saved.json.id}`)).response.status, 204);
  });
  it("rechaza sin destinatario, fecha imposible y evidencia inexistente", async () => {
    const coord = await person(true);
    for (const fields of [{}, { userId: coord.id, recognitionDate: "2026-02-30" }]) {
      assert.equal((await send(coord, "POST", "/recognitions", { title: "Premio de prueba", recognitionDate: "2026-10-18", ...fields })).response.status, 400);
    }
    assert.equal((await send(coord, "POST", "/recognitions", { title: "Premio con evidencia", recognitionDate: "2026-10-18", userId: coord.id, evidenceDocumentId: randomUUID() })).response.status, 404);
    const checks = await h.dataSource.query("PRAGMA foreign_key_check");
    assert.deepEqual(checks, []);
  });
});
