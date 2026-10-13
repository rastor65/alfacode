import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiRequestError, describeError, fieldErrorMessages } from "../api/errors";
import { tokenFromHash } from "./fragment-token";

const TOKEN = "Abc_123-".repeat(5) + "xyz";

describe("tokenFromHash", () => {
  it("lee el token del fragmento #token=", () => {
    assert.equal(TOKEN.length, 43);
    assert.equal(tokenFromHash(`#token=${TOKEN}`), TOKEN);
    assert.equal(tokenFromHash(`token=${TOKEN}`), TOKEN);
    assert.equal(tokenFromHash(`#otro=1&token=${TOKEN}`), TOKEN);
  });

  it("descarta fragmentos vacios, incompletos o con caracteres extranos", () => {
    for (const hash of ["", "#", "#token=", `#token=${TOKEN.slice(1)}`, `#token=${TOKEN}x`, `#token=${TOKEN.slice(1)}=`, "#token=<script>"]) {
      assert.equal(tokenFromHash(hash), null, hash);
    }
  });
});

describe("mensajes por campo", () => {
  const messages = { fullName: "nombre", email: "correo", password: "clave" };

  it("marca los campos que el backend rechazo", () => {
    const error = new ApiRequestError(400, "VALIDATION_ERROR", "x", [
      { field: "password", rules: ["minLength"] },
      { field: "desconocido", rules: [] },
    ]);

    assert.deepEqual(fieldErrorMessages(error, messages), { password: "clave" });
  });

  it("asocia el dominio no permitido al campo de correo", () => {
    const error = new ApiRequestError(400, "EMAIL_DOMAIN_NOT_ALLOWED", "x");

    assert.deepEqual(fieldErrorMessages(error, messages), { email: "Usa tu correo institucional @uniguajira.edu.co." });
    assert.deepEqual(fieldErrorMessages(error, { fullName: "nombre" }), {});
  });

  it("explica los errores de enlace y de registro deshabilitado", () => {
    assert.equal(describeError(new ApiRequestError(400, "INVALID_TOKEN", "x")), "El enlace no es válido o ya expiró.");
    assert.match(describeError(new ApiRequestError(503, "REGISTRATION_DISABLED", "x")), /Pide una invitación/);
  });
});
