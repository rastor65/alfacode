import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canCreateProject, canTransitionProject, projectAccess } from "./project-policy";
import { isCalendarDate } from "./projects.service";

describe("politica de proyectos", () => {
  it("las autoridades administran cualquier proyecto; el resto depende de su rol en el proyecto", () => {
    assert.equal(projectAccess(["admin"], null), "authority");
    assert.equal(projectAccess(["coordinator"], "collaborator"), "authority");
    assert.equal(projectAccess(["student"], "leader"), "leader");
    assert.equal(projectAccess(["researcher"], "collaborator"), "collaborator");
    // Un teacher_leader que no pertenece al proyecto no recibe acceso.
    assert.equal(projectAccess(["teacher_leader"], null), "none");
  });

  it("solo admin y coordinator crean proyectos por defecto", () => {
    assert.equal(canCreateProject(["admin"]), true);
    assert.equal(canCreateProject(["coordinator"]), true);
    assert.equal(canCreateProject(["teacher_leader"]), false);
  });

  it("un proyecto finalizado o cancelado no se reactiva", () => {
    assert.equal(canTransitionProject("proposed", "active"), true);
    assert.equal(canTransitionProject("active", "paused"), true);
    assert.equal(canTransitionProject("paused", "active"), true);
    assert.equal(canTransitionProject("completed", "active"), false);
    assert.equal(canTransitionProject("cancelled", "planning"), false);
    assert.equal(canTransitionProject("active", "proposed"), false);
  });

  it("valida fechas de calendario reales", () => {
    assert.equal(isCalendarDate("2026-10-13"), true);
    assert.equal(isCalendarDate("2028-02-29"), true);
    assert.equal(isCalendarDate("2026-02-30"), false);
    assert.equal(isCalendarDate("2026-13-01"), false);
  });
});
