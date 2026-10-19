import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { startHttpHarness, type HttpHarness } from "../../testing/http-harness";
import { pdfFixture } from "../../testing/file-fixtures";
import { AuditEvent } from "../audit/audit-event.entity";
import { EventDocument, EventParticipant } from "./event.entities";
let h: HttpHarness, documentsDir: string, counter = 0;
type Session = { cookies: string[]; csrf: string; id: string };
async function person(authority = false) {
  const email = `evento-${++counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles: [authority ? "coordinator" : "student"] });
  return { ...await h.loginOk(email), id: user.id };
}
const send = (s: Session, method: string, path: string, body?: unknown) => h.request(path, { method, body, cookies: s.cookies, csrf: s.csrf });
const payload = (organizerId: string, extra: Record<string, unknown> = {}) => ({ title: `Actividad ${++counter}`, type: "meeting", mode: "onsite", location: "Sala ficticia", organizerId, startsAt: "2026-10-18T09:00:00-05:00", endsAt: "2026-10-18T10:00:00-05:00", ...extra });
async function event(s: Session, extra: Record<string, unknown> = {}) {
  const dto = payload(s.id, extra), result = await send(s, "POST", "/events", dto);
  assert.equal(result.response.status, 201, result.text);
  return { dto, row: result.json as { id: string; status: string; startsAt: string; participantCount: number } };
}
async function team() {
  const coord = await person(true), leader = await person(), member = await person(), outsider = await person();
  const p = await send(coord, "POST", "/projects", { name: "Equipo de actividad", type: "research", methodology: "traditional" });
  for (const [s, role] of [[leader, "leader"], [member, "collaborator"]] as const) assert.equal((await send(coord, "POST", `/projects/${p.json.id}/members`, { userId: s.id, role })).response.status, 201);
  return { coord, leader, member, outsider, projectId: p.json.id as string };
}
before(async () => { documentsDir = await mkdtemp(join(tmpdir(), "alfacode-events-test-")); h = await startHttpHarness({ env: { DOCUMENTS_DIR: documentsDir, STORAGE_DRIVER: "local" } }); });
after(async () => { await h?.close(); if (documentsDir) await rm(documentsDir, { recursive: true, force: true }); });

describe("I-18: actividades y fechas", () => {
  it("autoridad crea institucional programada con organizador inscrito; integrante consulta sin correos", async () => {
    const coord = await person(true), user = await person();
    const { row } = await event(coord, { organizerId: user.id });
    assert.equal(row.status, "scheduled"); assert.equal(row.participantCount, 1);
    const detail = await send(user, "GET", `/events/${row.id}`);
    assert.equal(detail.response.status, 200); assert.equal(detail.json.permissions.canEdit, true);
    assert.equal(detail.text.includes("@uniguajira"), false);
    assert.equal((await send(user, "POST", "/events", payload(user.id))).response.status, 403);
    assert.equal((await send(coord, "POST", "/events", payload(coord.id, { status: "completed" }))).response.status, 400);
  });
  it("valida fechas, zona explicita, modalidad, enlaces y organizador activo", async () => {
    const coord = await person(true);
    const inactive = await h.createUser(`inactivo-evento-${++counter}@uniguajira.edu.co`, { status: "inactive" });
    for (const fields of [{ startsAt: "2026-02-30T12:00:00Z" }, { startsAt: "2026-10-18T12:00:00" }, { startsAt: "20261018T12:00:00Z" }, { endsAt: "2026-10-18T09:00:00-05:00" }, { location: "" }, { mode: "online", url: null }, { mode: "online", url: "javascript:alert(1)" }, { organizerId: inactive.id }, { organizerId: randomUUID() }, { mode: "inventado" }]) {
      const result = await send(coord, "POST", "/events", payload(coord.id, fields));
      assert.equal(result.response.status, 400, result.text);
    }
    for (const type of ["meeting", "training", "academic", "call", "internal", "other"]) await event(coord, { type, mode: "online", url: "https://example.org/sala" });
  });
  it("normaliza UTC y filtra por dia de Bogota, incluido cruce de medianoche", async () => {
    const coord = await person(true), title = `Frontera temporal ${++counter}`;
    const e = await event(coord, { title, startsAt: "2026-10-19T01:30:00Z", endsAt: "2026-10-19T02:30:00Z" });
    assert.equal(e.row.startsAt, "2026-10-19T01:30:00.000Z");
    const query = `q=${encodeURIComponent(title)}&from=2026-10-18&to=2026-10-18`;
    assert.equal((await send(coord, "GET", `/events?${query}`)).json.total, 1);
    assert.equal((await send(coord, "GET", `/events?q=${encodeURIComponent(title)}&from=2026-10-19&to=2026-10-19`)).json.total, 0);
    for (const dates of ["from=2026-02-30", "from=2026-10-20&to=2026-10-18"]) assert.equal((await send(coord, "GET", `/events?${dates}`)).response.status, 400);
    const crossingTitle = `Cruce de medianoche ${++counter}`;
    await event(coord, { title: crossingTitle, startsAt: "2026-10-18T23:30:00-05:00", endsAt: "2026-10-19T01:00:00-05:00" });
    for (const day of ["2026-10-18", "2026-10-19"]) assert.equal((await send(coord, "GET", `/events?q=${encodeURIComponent(crossingTitle)}&from=${day}&to=${day}`)).json.total, 1);
  });
  it("lider crea en su proyecto; ajeno no consulta ni altera actividad, asistencia o totales", async () => {
    const t = await team(), { row } = await event(t.leader, { projectId: t.projectId });
    assert.equal((await send(t.member, "GET", `/events/${row.id}`)).response.status, 200);
    for (const [method, suffix, body] of [["GET", "", undefined], ["PUT", "", payload(t.outsider.id)], ["POST", "/status", { status: "cancelled", reason: "Ajeno" }], ["GET", "/participants", undefined], ["PATCH", `/participants/${t.member.id}/attendance`, { attendance: "attended" }], ["GET", "/documents", undefined]] as const) {
      assert.equal((await send(t.outsider, method, `/events/${row.id}${suffix}`, body)).response.status, 404);
    }
    assert.equal((await send(t.outsider, "GET", `/events?projectId=${t.projectId}`)).json.total, 0);
    assert.equal((await send(t.member, "POST", "/events", payload(t.member.id, { projectId: t.projectId }))).response.status, 403);
    assert.equal((await send(t.coord, "POST", "/events", payload(t.outsider.id, { projectId: t.projectId }))).response.status, 400);
  });
  it("edita organizador sin duplicar su inscripcion y no mueve proyectos", async () => {
    const t = await team(), e = await event(t.leader, { projectId: t.projectId });
    const updated = await send(t.leader, "PUT", `/events/${e.row.id}`, { ...e.dto, organizerId: t.member.id });
    assert.equal(updated.response.status, 200, updated.text);
    const participants = await send(t.member, "GET", `/events/${e.row.id}/participants`);
    assert.equal(participants.json.total, 2);
    assert.equal(participants.json.items.find((p: { userId: string }) => p.userId === t.leader.id).role, "participant");
    assert.equal((await send(t.member, "PUT", `/events/${e.row.id}`, { ...e.dto, organizerId: t.member.id, title: "Editada por organizador" })).response.status, 200);
    assert.equal((await send(t.coord, "PUT", `/events/${e.row.id}`, { ...e.dto, projectId: null })).response.status, 409);
  });
  it("convocatoria conserva organizador externo, requisitos y enlace sin postulaciones", async () => {
    const coord = await person(true);
    const e = await event(coord, { type: "call", externalOrganizer: "Institucion ficticia", requirements: "Resumen y formulario externo", registrationUrl: "https://example.org/convocatoria" });
    const detail = await send(coord, "GET", `/events/${e.row.id}`);
    assert.equal(detail.json.requirements, "Resumen y formulario externo");
    const filtered = await send(coord, "GET", "/events?type=call&status=scheduled&pageSize=1");
    assert.equal(filtered.json.items.length, 1);
    assert.equal((await send(coord, "POST", "/events", payload(coord.id, { requirements: "Solo para convocatoria" }))).response.status, 400);
  });
});

describe("I-18: participacion, estados y asistencia", () => {
  it("impide duplicados por API y base; participante inicial solo registrado", async () => {
    const t = await team(), e = await event(t.leader, { projectId: t.projectId });
    const body = { userId: t.member.id, role: "speaker" };
    assert.equal((await send(t.leader, "POST", `/events/${e.row.id}/participants`, body)).json.attendance, "registered");
    assert.equal((await send(t.leader, "POST", `/events/${e.row.id}/participants`, body)).response.status, 409);
    await assert.rejects(() => h.dataSource.manager.insert(EventParticipant, { eventId: e.row.id, userId: t.member.id, role: "participant", attendance: "registered" }));
    assert.equal((await send(t.leader, "POST", `/events/${e.row.id}/participants`, { ...body, attendance: "attended" })).response.status, 400);
    assert.equal((await send(t.leader, "POST", `/events/${e.row.id}/participants`, { userId: t.outsider.id, role: "participant" })).response.status, 400);
  });
  it("solo autoridad confirma asistencia durante o despues, con auditoria y sin finalizar pendientes", async () => {
    const t = await team(), e = await event(t.leader, { projectId: t.projectId });
    await send(t.leader, "POST", `/events/${e.row.id}/participants`, { userId: t.member.id, role: "participant" });
    const mark = () => send(t.coord, "PATCH", `/events/${e.row.id}/participants/${t.member.id}/attendance`, { attendance: "attended" });
    assert.equal((await mark()).response.status, 409);
    assert.equal((await send(t.leader, "POST", `/events/${e.row.id}/status`, { status: "in_progress" })).response.status, 200);
    assert.equal((await send(t.leader, "PATCH", `/events/${e.row.id}/participants/${t.member.id}/attendance`, { attendance: "attended" })).response.status, 403);
    assert.equal((await mark()).response.status, 200);
    assert.equal((await send(t.leader, "POST", `/events/${e.row.id}/status`, { status: "completed" })).response.status, 200);
    const roster = await send(t.member, "GET", `/events/${e.row.id}/participants`);
    assert.equal(roster.json.items.find((p: { userId: string }) => p.userId === t.leader.id).attendance, "registered");
    assert.equal((await send(t.coord, "PATCH", `/events/${e.row.id}/participants/${t.member.id}/attendance`, { attendance: "absent" })).response.status, 200);
    assert.equal((await send(t.leader, "PUT", `/events/${e.row.id}`, e.dto)).response.status, 409);
    assert.equal((await send(t.coord, "POST", `/events/${e.row.id}/status`, { status: "in_progress" })).response.status, 409);
    const audits = await h.dataSource.manager.findBy(AuditEvent, { targetId: e.row.id, action: "event.attendance_changed" });
    assert.equal(audits.length, 2); assert.ok(audits.every(a => a.actorUserId === t.coord.id));
  });
  it("retira solo inscripciones sin asistencia y conserva cancelacion con motivo", async () => {
    const coord = await person(true), user = await person(), e = await event(coord);
    assert.equal((await send(coord, "DELETE", `/events/${e.row.id}/participants/${coord.id}`)).response.status, 409);
    await send(coord, "POST", `/events/${e.row.id}/participants`, { userId: user.id });
    assert.equal((await send(coord, "DELETE", `/events/${e.row.id}/participants/${user.id}`)).response.status, 204);
    await send(coord, "POST", `/events/${e.row.id}/participants`, { userId: user.id });
    assert.equal((await send(coord, "DELETE", `/events/${e.row.id}`)).response.status, 409);
    assert.equal((await send(coord, "POST", `/events/${e.row.id}/status`, { status: "cancelled" })).response.status, 400);
    assert.equal((await send(coord, "POST", `/events/${e.row.id}/status`, { status: "cancelled", reason: "Motivo ficticio" })).response.status, 200);
    assert.equal((await send(coord, "GET", `/events/${e.row.id}/participants`)).json.total, 2);
    assert.equal((await send(coord, "PATCH", `/events/${e.row.id}/participants/${user.id}/attendance`, { attendance: "attended" })).response.status, 409);
    const empty = await event(coord);
    assert.equal((await send(coord, "DELETE", `/events/${empty.row.id}`)).response.status, 204);
    assert.equal((await send(coord, "GET", `/events/${empty.row.id}`)).response.status, 404);
  });
  it("pagina participantes sin exponer correos y mantiene sesion/CSRF", async () => {
    const coord = await person(true), e = await event(coord);
    const roster = await send(coord, "GET", `/events/${e.row.id}/participants?pageSize=1`);
    assert.equal(roster.json.items.length, 1); assert.equal(roster.text.includes("@uniguajira"), false);
    assert.equal((await h.request("/events")).response.status, 401);
    assert.equal((await h.request(`/events/${e.row.id}/status`, { method: "POST", cookies: coord.cookies, body: { status: "in_progress" } })).response.status, 403);
    assert.equal((await send(coord, "GET", "/events?pageSize=101")).response.status, 400);
  });
});

describe("I-18: evidencia documental", () => {
  it("vincula archivos existentes sin ampliar permisos, copiar ni borrar el archivo al desvincular", async () => {
    const t = await team(), e = await event(t.leader, { projectId: t.projectId });
    const form = new FormData(); form.append("file", new Blob([new Uint8Array(pdfFixture())]), "Acta.pdf"); form.append("accessLevel", "private");
    const uploaded = await fetch(`${h.baseUrl}/api/v1/projects/${t.projectId}/documents`, { method: "POST", body: form, headers: { Origin: "http://localhost:3000", Cookie: t.coord.cookies.join("; "), "X-CSRF-Token": t.coord.csrf, "X-Forwarded-For": h.freshIp() } });
    assert.equal(uploaded.status, 201); const doc = await uploaded.json() as { id: string };
    assert.equal((await send(t.coord, "POST", `/events/${e.row.id}/documents`, { documentId: doc.id })).response.status, 201);
    assert.equal((await send(t.coord, "POST", `/events/${e.row.id}/documents`, { documentId: doc.id })).response.status, 409);
    assert.equal((await send(t.member, "GET", `/events/${e.row.id}/documents`)).json.total, 0);
    assert.equal((await send(t.member, "GET", `/documents/${doc.id}/download`)).response.status, 404);
    assert.equal((await send(t.leader, "POST", `/events/${e.row.id}/documents`, { documentId: doc.id })).response.status, 404);
    const institutional = await event(t.coord);
    assert.equal((await send(t.coord, "POST", `/events/${institutional.row.id}/documents`, { documentId: doc.id })).response.status, 400);
    assert.equal((await send(t.coord, "DELETE", `/events/${e.row.id}/documents/${doc.id}`)).response.status, 204);
    assert.equal((await send(t.coord, "GET", `/documents/${doc.id}`)).response.status, 200);
    await send(t.coord, "POST", `/events/${e.row.id}/documents`, { documentId: doc.id });
    await send(t.coord, "DELETE", `/documents/${doc.id}`);
    assert.equal(await h.dataSource.manager.countBy(EventDocument, { eventId: e.row.id }), 0);
    assert.deepEqual(await h.dataSource.query("PRAGMA foreign_key_check"), []);
  });
});
