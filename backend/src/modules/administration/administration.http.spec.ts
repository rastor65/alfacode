import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { startHttpHarness, type HttpHarness } from "../../testing/http-harness";
import type { RoleCode } from "../roles/role.entity";
import { AdministrativeRequest, REQUEST_TYPES } from "./administrative-request.entity";

let h: HttpHarness, counter = 0;
type Session = { id: string; csrf: string; cookies: string[] };
before(async () => { h = await startHttpHarness(); });
after(async () => { await h?.close(); });
async function person(role: RoleCode = "student") {
  const email = `administracion-${++counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles: [role] });
  return { ...await h.loginOk(email), id: user.id };
}
const send = (s: Session, method: string, path: string, body?: unknown) => h.request(path, { method, body, cookies: s.cookies, csrf: s.csrf });
const payload = (extra: Record<string, unknown> = {}) => ({ type: "general", subject: `Solicitud ficticia ${++counter}`, description: "Descripcion de una peticion ficticia para pruebas", ...extra });
async function create(s: Session, extra: Record<string, unknown> = {}) {
  const r = await send(s, "POST", "/administrative-requests", payload(extra));
  assert.equal(r.response.status, 201, r.text); return r.json as { id: string; status: string };
}
const change = (s: Session, id: string, status: string, response = "Respuesta ficticia y razon de la decision") => send(s, "POST", `/administrative-requests/${id}/status`, { status, response });

describe("I-20: solicitudes administrativas", () => {
  it("registra los cinco tipos como propias y pendientes, sin duplicar vinculaciones", async () => {
    const owner = await person();
    const membershipBefore = (await h.dataSource.query("SELECT count(*) AS n FROM membership_requests"))[0].n;
    for (const type of REQUEST_TYPES) {
      const row = await create(owner, { type });
      const detail = await send(owner, "GET", `/administrative-requests/${row.id}`);
      assert.equal(detail.json.type, type); assert.equal(detail.json.requesterId, owner.id);
      assert.equal(detail.json.status, "pending"); assert.equal(detail.json.reviewerId, null);
      assert.deepEqual(detail.json.permissions.allowedTransitions, []);
      assert.equal(detail.text.includes("@uniguajira"), false);
    }
    assert.equal((await h.dataSource.query("SELECT count(*) AS n FROM membership_requests"))[0].n, membershipBefore);
    assert.equal((await send(owner, "POST", "/administrative-requests", payload({ type: "membership" }))).response.status, 400);
  });
  it("rechaza asignacion masiva, contenido vacio y valores invalidos sin crear registros", async () => {
    const owner = await person(), before = await h.dataSource.manager.count(AdministrativeRequest);
    for (const extra of [{ requesterId: randomUUID() }, { status: "approved" }, { reviewerId: owner.id }, { response: "Aprobada" }, { reviewedBy: owner.id }, { subject: "   " }, { description: "breve" }, { subject: null }, { type: null }, { description: "x".repeat(10001) }]) {
      const r = await send(owner, "POST", "/administrative-requests", payload(extra));
      assert.equal(r.response.status, 400, r.text);
    }
    assert.equal(await h.dataSource.manager.count(AdministrativeRequest), before);
  });
  it("limita filas antes de contar/paginar y no revela detalle ni historial ajenos", async () => {
    const owner = await person(), outsider = await person(), leader = await person("teacher_leader");
    const row = await create(owner);
    for (const actor of [outsider, leader]) {
      const list = await send(actor, "GET", "/administrative-requests?pageSize=1");
      assert.equal(list.json.total, 0); assert.deepEqual(list.json.items, []);
      for (const suffix of ["", "/history"]) assert.equal((await send(actor, "GET", `/administrative-requests/${row.id}${suffix}`)).response.status, 404);
      assert.equal((await send(actor, "GET", "/administrative-requests?view=review")).response.status, 403);
      assert.equal((await change(actor, row.id, "in_review")).response.status, 404);
    }
    const own = await send(owner, "GET", "/administrative-requests?pageSize=1");
    assert.equal(own.json.total, 1); assert.equal(own.json.items[0].id, row.id);
  });
  it("separa bandeja propia de revision y permite autoridad sobre solicitudes ajenas", async () => {
    const coord = await person("coordinator"), admin = await person("admin"), owner = await person();
    const own = await create(coord), other = await create(owner);
    const mine = await send(coord, "GET", "/administrative-requests");
    assert.equal(mine.json.total, 1); assert.equal(mine.json.items[0].id, own.id);
    assert.equal((await send(admin, "GET", `/administrative-requests/${other.id}`)).response.status, 200);
    const review = await send(coord, "GET", "/administrative-requests?view=review&pageSize=100");
    assert.ok(review.json.items.some((r: { id: string }) => r.id === other.id));
    assert.equal(review.json.permissions.canReview, true);
    assert.equal(review.text.includes("@uniguajira"), false);
  });
  it("impide tramitar o asignarse solicitud propia incluso con rol admin", async () => {
    const admin = await person("admin"), reviewer = await person("coordinator"), row = await create(admin);
    for (const status of ["in_review", "approved", "rejected", "completed"]) assert.equal((await change(admin, row.id, status)).response.status, 403);
    assert.equal((await send(admin, "PATCH", `/administrative-requests/${row.id}/reviewer`, { reviewerId: reviewer.id })).response.status, 403);
    assert.equal((await send(reviewer, "PATCH", `/administrative-requests/${row.id}/reviewer`, { reviewerId: admin.id })).response.status, 400);
    const history = await send(admin, "GET", `/administrative-requests/${row.id}/history`);
    assert.equal(history.json.total, 1);
    assert.equal((await change(reviewer, row.id, "in_review")).response.status, 200);
  });
  it("asigna solo autoridad activa distinta del solicitante y audita reasignacion", async () => {
    const coord = await person("coordinator"), admin = await person("admin"), student = await person(), row = await create(student);
    const inactive = await h.createUser(`inactivo-administracion-${++counter}@uniguajira.edu.co`, { status: "inactive", roles: ["coordinator"] });
    for (const id of [student.id, inactive.id, randomUUID()]) assert.equal((await send(coord, "PATCH", `/administrative-requests/${row.id}/reviewer`, { reviewerId: id })).response.status, 400);
    assert.equal((await send(student, "PATCH", `/administrative-requests/${row.id}/reviewer`, { reviewerId: coord.id })).response.status, 403);
    assert.equal((await send(coord, "PATCH", `/administrative-requests/${row.id}/reviewer`, { reviewerId: admin.id })).response.status, 200);
    assert.equal((await change(coord, row.id, "in_review")).json.reviewerId, admin.id);
    assert.equal((await send(admin, "PATCH", `/administrative-requests/${row.id}/reviewer`, { reviewerId: coord.id })).response.status, 200);
    const history = await send(student, "GET", `/administrative-requests/${row.id}/history`);
    assert.equal(history.json.items.filter((e: { action: string }) => e.action.endsWith("reviewer_assigned")).length, 2);
  });
  it("exige transiciones validas, respuesta y registra actor/fecha de decision y ejecucion", async () => {
    const owner = await person(), coord = await person("coordinator"), admin = await person("admin"), row = await create(owner);
    assert.equal((await change(coord, row.id, "approved")).response.status, 409);
    assert.equal((await change(coord, row.id, "in_review", "")).response.status, 200);
    for (const response of ["", "   "]) assert.equal((await change(coord, row.id, "approved", response)).response.status, 400);
    const approved = await change(coord, row.id, "approved", "Se acepta la peticion ficticia");
    assert.equal(approved.response.status, 200, approved.text);
    assert.equal(approved.json.reviewedBy, coord.id); assert.ok(approved.json.reviewedAt);
    assert.equal(approved.json.completedBy, null);
    const completed = await change(admin, row.id, "completed", "Tramite ejecutado manualmente");
    assert.equal(completed.response.status, 200, completed.text);
    assert.equal(completed.json.completedBy, admin.id); assert.ok(completed.json.completedAt);
    assert.equal(completed.json.reviewedBy, coord.id);
    assert.equal((await change(coord, row.id, "in_review")).response.status, 409);
    assert.equal((await send(coord, "PATCH", `/administrative-requests/${row.id}/reviewer`, { reviewerId: admin.id })).response.status, 409);
    const history = await send(owner, "GET", `/administrative-requests/${row.id}/history`);
    assert.equal(history.json.total, 4);
    assert.ok(history.json.items.some((e: { details: { response?: string } }) => e.details.response === "Se acepta la peticion ficticia"));
    assert.ok(history.json.items.some((e: { actor: { id: string }; details: { to?: string } }) => e.details.to === "completed" && e.actor.id === admin.id));
  });
  it("rechazo es final y no permite aprobar ni completar posteriormente", async () => {
    const owner = await person(), coord = await person("coordinator"), row = await create(owner);
    await change(coord, row.id, "in_review");
    assert.equal((await change(coord, row.id, "rejected")).response.status, 200);
    for (const status of ["approved", "completed", "in_review", "pending"]) assert.equal((await change(coord, row.id, status)).response.status, 409);
    assert.equal((await send(owner, "GET", `/administrative-requests/${row.id}/history`)).json.total, 3);
  });
  it("aprobar no modifica cuentas, roles ni vinculacion; salida requiere procedimiento separado", async () => {
    const owner = await person(), coord = await person("coordinator");
    for (const type of ["data_change", "responsibility_change", "withdrawal"]) {
      const row = await create(owner, { type });
      await change(coord, row.id, "in_review");
      assert.equal((await change(coord, row.id, "approved")).response.status, 200);
      if (type === "withdrawal") assert.equal((await change(coord, row.id, "completed")).response.status, 409);
    }
    const current = await send(owner, "GET", "/auth/me");
    assert.equal(current.response.status, 200); assert.equal(current.json.accountStatus, "active");
    assert.deepEqual(current.json.roles, ["student"]);
  });
  it("filtra busqueda literal, tipo, estado y responsable sin alterar los totales propios", async () => {
    const owner = await person(), coord = await person("coordinator");
    const first = await create(owner, { subject: "Certificado 100% ficticio", type: "certificate" });
    await create(owner, { subject: "Certificado sin porcentaje", type: "certificate" });
    await change(coord, first.id, "in_review");
    const filtered = await send(owner, "GET", `/administrative-requests?type=certificate&status=in_review&reviewerId=${coord.id}&q=%25&pageSize=1`);
    assert.equal(filtered.json.total, 1); assert.equal(filtered.json.items[0].id, first.id);
    assert.equal((await send(owner, "GET", "/administrative-requests?page=2&pageSize=1")).json.items.length, 1);
    assert.equal((await send(owner, "GET", `/administrative-requests/${first.id}/history?pageSize=1&page=2`)).json.items.length, 1);
    for (const query of ["pageSize=101", "page=0", "status=unknown", "view=all", "requesterId=" + coord.id]) assert.equal((await send(owner, "GET", `/administrative-requests?${query}`)).response.status, 400);
  });
  it("exige sesion/CSRF/origen y rechaza campos protegidos en transiciones", async () => {
    const owner = await person(), coord = await person("coordinator"), row = await create(owner);
    assert.equal((await h.request("/administrative-requests")).response.status, 401);
    assert.equal((await h.request("/administrative-requests", { method: "POST", cookies: owner.cookies, body: payload() })).response.status, 403);
    assert.equal((await h.request(`/administrative-requests/${row.id}/status`, { method: "POST", cookies: coord.cookies, csrf: coord.csrf, origin: "https://example.org", body: { status: "in_review" } })).response.status, 403);
    assert.equal((await send(coord, "POST", `/administrative-requests/${row.id}/status`, { status: "in_review", reviewedBy: owner.id })).response.status, 400);
    assert.equal((await send(coord, "GET", "/administrative-requests/no-uuid")).response.status, 400);
    assert.equal((await send(coord, "GET", `/administrative-requests/${randomUUID()}`)).response.status, 404);
  });
  it("la base rechaza autorrevision y relaciones huerfanas", async () => {
    const owner = await person(), row = await create(owner);
    for (const field of ["reviewerId", "reviewedBy", "completedBy"]) await assert.rejects(() => h.dataSource.manager.update(AdministrativeRequest, row.id, { [field]: owner.id }));
    await assert.rejects(() => h.dataSource.manager.update(AdministrativeRequest, row.id, { reviewerId: randomUUID() }));
    assert.deepEqual(await h.dataSource.query("PRAGMA foreign_key_check"), []);
  });
});
