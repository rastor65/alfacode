import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { startHttpHarness, type HttpHarness } from "../../testing/http-harness";
import { pdfFixture } from "../../testing/file-fixtures";
import type { RoleCode } from "../roles/role.entity";
import { User } from "../users/user.entity";
import { deactivateAccount } from "../users/deactivate-account";
import { RequestAttachment } from "../documents/request-attachment.entity";

let h: HttpHarness, dir: string, counter = 0;
type Person = { id: string; csrf: string; cookies: string[] };
before(async () => { dir = await mkdtemp(join(tmpdir(), "alfacode-admin-flows-")); h = await startHttpHarness({ env: { DOCUMENTS_DIR: dir, STORAGE_DRIVER: "local" } }); });
after(async () => { await h?.close(); if (dir) await rm(dir, { recursive: true, force: true }); });
async function person(roles: RoleCode[] = ["student"]) {
  const email = `tramite-${++counter}@uniguajira.edu.co`, u = await h.createUser(email, { roles });
  return { ...await h.loginOk(email), id: u.id };
}
const send = (p: Person, method: string, path: string, body?: unknown) => h.request(path, { method, body, cookies: p.cookies, csrf: p.csrf });
async function request(p: Person, type = "general") {
  const r = await send(p, "POST", "/administrative-requests", { type, subject: "Tramite ficticio I-21", description: "Descripcion ficticia del tramite de prueba" });
  assert.equal(r.response.status, 201, r.text); return r.json.id as string;
}
const transition = (p: Person, id: string, status: string) => send(p, "POST", `/administrative-requests/${id}/status`, { status, response: "Respuesta ficticia suficientemente explicativa" });
async function approve(p: Person, id: string) { assert.equal((await transition(p, id, "in_review")).response.status, 200); assert.equal((await transition(p, id, "approved")).response.status, 200); }
const execute = (p: Person, id: string, requesterId: string) => send(p, "POST", `/administrative-requests/${id}/withdrawal`, { requesterId, response: "Confirmo la salida y la revision de responsabilidades" });
async function upload(p: Person, id: string, fields: Record<string, string> = {}, content = pdfFixture()) {
  const form = new FormData(); form.append("file", new Blob([new Uint8Array(content)]), "Soporte.pdf");
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  const r = await fetch(`${h.baseUrl}/api/v1/administrative-requests/${id}/documents`, { method: "POST", body: form,
    headers: { Origin: "http://localhost:3000", Cookie: p.cookies.join("; "), "X-CSRF-Token": p.csrf, "X-Forwarded-For": h.freshIp() } });
  return { status: r.status, json: await r.json() };
}

describe("I-21: adjuntos privados de solicitudes", () => {
  it("solicitante adjunta, autoridad aporta respuesta y ajeno no ve metadatos, lista ni descarga", async () => {
    const owner = await person(), coord = await person(["coordinator"]), outsider = await person(), id = await request(owner);
    const a = await upload(owner, id); assert.equal(a.status, 201, JSON.stringify(a.json));
    const b = await upload(coord, id); assert.equal(b.status, 201);
    assert.equal(a.json.accessLevel, "private"); assert.equal(a.json.administrativeRequestId, id);
    assert.equal((await send(owner, "GET", `/documents/${b.json.id}`)).response.status, 200);
    assert.equal((await send(coord, "GET", `/administrative-requests/${id}/documents`)).json.total, 2);
    assert.equal((await send(owner, "GET", `/administrative-requests/${id}/documents?pageSize=1&page=2`)).json.items.length, 1);
    for (const path of [`/administrative-requests/${id}/documents`, `/documents/${a.json.id}`, `/documents/${b.json.id}/download`])
      assert.equal((await send(outsider, "GET", path)).response.status, 404);
    assert.equal((await send(outsider, "GET", "/documents")).json.total, 0);
    assert.equal((await upload(outsider, id)).status, 404);
    assert.equal((await send(owner, "GET", `/administrative-requests/${id}/history`)).json.total, 3);
  });
  it("impide compartir o publicar por endpoints genericos y limpia cargas rechazadas", async () => {
    const owner = await person(), outsider = await person(), id = await request(owner);
    const before = (await readdir(dir)).length;
    const disallowed: Record<string, string>[] = [{ accessLevel: "general" }, { grantedUserIds: outsider.id }];
    for (const fields of disallowed) assert.equal((await upload(owner, id, fields)).status, 400);
    assert.equal((await upload(owner, id, {}, Buffer.from("archivo falso"))).status, 415);
    assert.equal((await readdir(dir)).length, before);
    const doc = await upload(owner, id); assert.equal(doc.status, 201);
    assert.equal((await send(owner, "PATCH", `/documents/${doc.json.id}`, { accessLevel: "general" })).response.status, 409);
    assert.equal((await send(owner, "PATCH", `/documents/${doc.json.id}`, { grantedUserIds: [outsider.id] })).response.status, 409);
    assert.equal((await send(owner, "DELETE", `/documents/${doc.json.id}`)).response.status, 204);
    assert.equal(await h.dataSource.manager.countBy(RequestAttachment, { requestId: id }), 0);
    assert.equal((await readdir(dir)).length, before);
  });
  it("revocar rol de autoridad revoca acceso al adjunto que subio para otra persona", async () => {
    const owner = await person(), reviewer = await person(["coordinator", "student"]), admin = await person(["admin"]), id = await request(owner);
    const doc = await upload(reviewer, id); assert.equal(doc.status, 201);
    assert.equal((await send(admin, "DELETE", `/users/${reviewer.id}/roles/coordinator`)).response.status, 200);
    assert.equal((await send(reviewer, "GET", `/documents/${doc.json.id}`)).response.status, 404);
    assert.equal((await send(reviewer, "GET", "/documents")).json.total, 0);
    assert.equal((await send(owner, "GET", `/documents/${doc.json.id}`)).response.status, 200);
  });
  it("aprobada admite adjunto de autoridad; rechazada/completada conservan archivos en solo lectura", async () => {
    const coord = await person(["coordinator"]), owner = await person(), id = await request(owner);
    const doc = await upload(owner, id); await approve(coord, id);
    assert.equal((await upload(owner, id)).status, 409);
    assert.equal((await upload(coord, id)).status, 201);
    assert.equal((await transition(coord, id, "completed")).response.status, 200);
    assert.equal((await send(coord, "DELETE", `/documents/${doc.json.id}`)).response.status, 409);
    assert.equal((await upload(coord, id)).status, 409);
    const downloaded = await fetch(`${h.baseUrl}/api/v1/documents/${doc.json.id}/download`, { headers: { Cookie: owner.cookies.join("; "), "X-Forwarded-For": h.freshIp() } });
    assert.equal(downloaded.status, 200); await downloaded.arrayBuffer();
    const rejected = await request(owner); const retained = await upload(owner, rejected);
    await transition(coord, rejected, "in_review"); await transition(coord, rejected, "rejected");
    assert.equal((await send(owner, "DELETE", `/documents/${retained.json.id}`)).response.status, 409);
  });
});

describe("I-21: desvinculacion segura", () => {
  it("evita ejecutar dos veces la misma salida por envios simultaneos", async () => {
    const owner = await person(), coord = await person(["coordinator"]), id = await request(owner, "withdrawal");
    await approve(coord, id);
    const results = await Promise.all([execute(coord, id, owner.id), execute(coord, id, owner.id)]);
    assert.deepEqual(results.map(r => r.response.status).sort(), [200, 409]);
    const history = await send(coord, "GET", `/administrative-requests/${id}/history`);
    assert.equal(history.json.items.filter((e: { action: string }) => e.action === "administrative_request.withdrawal_executed").length, 1);
  });
  it("lista responsables activos sin duplicados ni correos y solo para autoridades", async () => {
    const owner = await person(), coord = await person(["coordinator", "admin"]);
    assert.equal((await send(owner, "GET", "/administrative-requests/reviewers")).response.status, 403);
    const list = await send(coord, "GET", "/administrative-requests/reviewers?pageSize=100");
    assert.equal(list.response.status, 200, list.text);
    assert.equal(list.json.items.filter((p: { id: string }) => p.id === coord.id).length, 1);
    assert.equal(list.text.includes("@uniguajira"), false);
  });
  it("exige aprobacion, confirmacion y autoridad; bloquea liderazgos, tareas y actividades pendientes", async () => {
    const owner = await person(), coord = await person(["coordinator"]), id = await request(owner, "withdrawal");
    assert.equal((await execute(coord, id, owner.id)).response.status, 409);
    await approve(coord, id);
    assert.equal((await execute(owner, id, owner.id)).response.status, 403);
    assert.equal((await execute(coord, id, coord.id)).response.status, 400);
    const p = await send(coord, "POST", "/projects", { name: "Proyecto con responsabilidades", type: "research", methodology: "traditional", joinAsLeader: true });
    const projectId = p.json.id;
    assert.equal((await send(coord, "POST", `/projects/${projectId}/members`, { userId: owner.id, role: "leader" })).response.status, 201);
    const task = await send(coord, "POST", `/projects/${projectId}/tasks`, { title: "Tarea por reasignar", assigneeId: owner.id });
    const event = await send(coord, "POST", "/events", { title: "Actividad por reasignar", type: "meeting", mode: "onsite", location: "Sala ficticia", organizerId: owner.id,
      startsAt: "2026-10-20T10:00:00-05:00", endsAt: "2026-10-20T11:00:00-05:00" });
    assert.equal(task.response.status, 201); assert.equal(event.response.status, 201);
    const blocked = await execute(coord, id, owner.id); assert.equal(blocked.response.status, 409, blocked.text);
    const pending = await send(coord, "GET", `/administrative-requests/${id}/withdrawal?pageSize=1`);
    assert.equal(pending.json.total, 3); assert.equal(pending.json.items.length, 1);
    assert.equal((await send(owner, "GET", "/auth/me")).response.status, 200);
    assert.equal((await send(coord, "GET", `/administrative-requests/${id}/history`)).json.total, 3);
    assert.equal((await send(coord, "PATCH", `/projects/${projectId}/members/${owner.id}`, { role: "collaborator" })).response.status, 200);
    assert.equal((await send(coord, "PATCH", `/projects/${projectId}/tasks/${task.json.id}`, { assigneeId: coord.id })).response.status, 200);
    assert.equal((await send(coord, "POST", `/events/${event.json.id}/status`, { status: "cancelled", reason: "Actividad cancelada ficticia" })).response.status, 200);
    assert.equal((await execute(coord, id, owner.id)).response.status, 200);
    assert.equal((await send(owner, "GET", "/auth/me")).response.status, 401);
    const completed = await send(coord, "GET", `/administrative-requests/${id}`);
    assert.equal(completed.json.status, "completed"); assert.equal(completed.json.reviewedBy, coord.id);
    assert.equal((await send(coord, "GET", `/projects/${projectId}`)).json.members.some((m: { userId: string }) => m.userId === owner.id), true);
    assert.equal((await execute(coord, id, owner.id)).response.status, 409);
  });
  it("responsable de otra solicitud debe reasignarse y coordinator no desactiva a otro coordinator", async () => {
    const owner = await person(["coordinator"]), admin = await person(["admin"]), coord = await person(["coordinator"]), student = await person();
    const id = await request(owner, "withdrawal"), other = await request(student);
    await send(admin, "PATCH", `/administrative-requests/${other}/reviewer`, { reviewerId: owner.id });
    await approve(admin, id);
    assert.equal((await execute(coord, id, owner.id)).response.status, 403);
    assert.equal((await execute(admin, id, owner.id)).response.status, 409);
    await send(admin, "PATCH", `/administrative-requests/${other}/reviewer`, { reviewerId: admin.id });
    assert.equal((await execute(admin, id, owner.id)).response.status, 200);
    assert.equal((await send(owner, "GET", "/auth/me")).response.status, 401);
  });
  it("vuelve a comprobar responsabilidades tras la vista previa y conserva historial academico", async () => {
    const owner = await person(), coord = await person(["coordinator"]), id = await request(owner, "withdrawal");
    await approve(coord, id);
    assert.equal((await send(coord, "GET", `/administrative-requests/${id}/withdrawal`)).json.total, 0);
    const product = await send(coord, "POST", "/academic-products", { type: "article", title: "Autoria historica", status: "published", authors: [{ userId: owner.id }] });
    const eventPayload = { title: "Organizacion posterior a la vista previa", type: "meeting", mode: "onsite", location: "Sala ficticia", organizerId: owner.id,
      startsAt: "2026-10-20T10:00:00-05:00", endsAt: "2026-10-20T11:00:00-05:00" };
    const event = await send(coord, "POST", "/events", eventPayload);
    assert.equal((await execute(coord, id, owner.id)).response.status, 409);
    await send(coord, "POST", `/events/${event.json.id}/status`, { status: "in_progress" });
    await send(coord, "PATCH", `/events/${event.json.id}/participants/${owner.id}/attendance`, { attendance: "attended" });
    await send(coord, "POST", `/events/${event.json.id}/status`, { status: "completed" });
    assert.equal((await execute(coord, id, owner.id)).response.status, 200);
    assert.equal((await send(coord, "GET", `/academic-products/${product.json.id}`)).json.authors[0].userId, owner.id);
    assert.equal((await send(coord, "GET", `/events/${event.json.id}/participants`)).json.items[0].attendance, "attended");
    assert.deepEqual(await h.dataSource.query("PRAGMA foreign_key_check"), []);
  });
  it("la regla compartida no permite desactivar al ultimo admin activo", async () => {
    await h.dataSource.query("UPDATE users SET account_status = 'inactive' WHERE id IN (SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.code = 'admin')");
    const admin = await person(["admin"]), coord = await person(["coordinator"]);
    const target = await h.dataSource.manager.findOneOrFail(User, { where: { id: admin.id }, relations: { roles: true } });
    // Actor con rol admin sintetico para alcanzar la guarda compartida, que se prueba tambien en users.http.spec.
    await assert.rejects(() => h.dataSource.transaction(m => deactivateAccount(m, { id: coord.id, roles: [{ code: "admin" }] }, target, "Prueba de ultimo administrador")), (e: unknown) => e instanceof Error && e.message.includes("administrador activo"));
    assert.equal((await send(admin, "GET", "/auth/me")).response.status, 200);
  });
});
