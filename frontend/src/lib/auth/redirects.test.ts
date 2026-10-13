import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_AFTER_LOGIN, safeNextPath } from "./redirects";

describe("safeNextPath", () => {
  it("acepta rutas internas con consulta y fragmento", () => {
    assert.equal(safeNextPath("/panel"), "/panel");
    assert.equal(safeNextPath("/proyectos/x?tab=2#detalle"), "/proyectos/x?tab=2#detalle");
    assert.equal(safeNextPath(["/panel", "/otra"]), "/panel");
  });

  it("rechaza destinos externos o peligrosos (redireccion abierta)", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "evil.example",
      "/panel\nSet-Cookie: x=1",
      "/\u0000panel",
      `/${"a".repeat(600)}`,
      "",
      undefined,
      null,
    ]) {
      assert.equal(safeNextPath(value as string), DEFAULT_AFTER_LOGIN, String(value));
    }
  });

  it("no vuelve a la pantalla de login", () => {
    assert.equal(safeNextPath("/ingresar"), DEFAULT_AFTER_LOGIN);
    assert.equal(safeNextPath("/ingresar?next=/panel"), DEFAULT_AFTER_LOGIN);
    assert.equal(safeNextPath("/registro"), DEFAULT_AFTER_LOGIN);
    assert.equal(safeNextPath("/cambiar-contrasena"), DEFAULT_AFTER_LOGIN);
  });
});
