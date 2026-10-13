import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_THEME, parseThemePreference, themeCookie } from "./theme";

describe("preferencia de tema", () => {
  it("acepta claro, oscuro y sistema", () => {
    assert.equal(parseThemePreference("light"), "light");
    assert.equal(parseThemePreference("dark"), "dark");
    assert.equal(parseThemePreference("system"), "system");
  });

  it("sin preferencia valida sigue al sistema (no fuerza el modo oscuro)", () => {
    assert.equal(DEFAULT_THEME, "system");
    for (const value of [undefined, null, "", "DARK", "azul", "light;evil=1"]) {
      assert.equal(parseThemePreference(value), "system", String(value));
    }
  });

  it("guarda la preferencia un ano, para todo el sitio y Secure solo en https", () => {
    assert.equal(themeCookie("dark", false), "alfacode_theme=dark; Path=/; Max-Age=31536000; SameSite=Lax");
    assert.match(themeCookie("light", true), /; Secure$/);
  });
});
