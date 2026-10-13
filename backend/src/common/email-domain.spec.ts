import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "./api-error";
import { DEFAULT_ALLOWED_EMAIL_DOMAINS, assertAllowedEmail, isAllowedEmail, parseAllowedEmailDomains } from "./email-domain";

describe("isAllowedEmail", () => {
  const allowed = DEFAULT_ALLOWED_EMAIL_DOMAINS;

  it("admite solo el dominio institucional, sin importar mayusculas ni espacios", () => {
    assert.equal(isAllowedEmail("persona@uniguajira.edu.co", allowed), true);
    assert.equal(isAllowedEmail("  Persona@UniGuajira.EDU.CO ", allowed), true);
  });

  it("rechaza otros dominios, subdominios e imitaciones", () => {
    for (const email of [
      "persona@gmail.com",
      "persona@estudiantes.uniguajira.edu.co",
      "persona@uniguajira.edu.co.evil.com",
      "persona@evil-uniguajira.edu.co",
      "persona@uniguajira.edu",
      "uniguajira.edu.co@gmail.com",
      "persona@uniguajira.edu.co@gmail.com",
      "@uniguajira.edu.co",
      "sin-arroba",
    ]) {
      assert.equal(isAllowedEmail(email, allowed), false, email);
    }
  });
});

describe("assertAllowedEmail", () => {
  it("responde 400 EMAIL_DOMAIN_NOT_ALLOWED indicando el dominio permitido", () => {
    assert.throws(
      () => assertAllowedEmail("persona@gmail.com", DEFAULT_ALLOWED_EMAIL_DOMAINS),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.getStatus(), 400);
        assert.deepEqual(error.getResponse(), {
          code: "EMAIL_DOMAIN_NOT_ALLOWED",
          message: "Solo se admiten correos institucionales (@uniguajira.edu.co)",
          details: null,
        });
        return true;
      },
    );
  });
});

describe("parseAllowedEmailDomains", () => {
  it("usa uniguajira.edu.co por defecto", () => {
    assert.deepEqual(parseAllowedEmailDomains(undefined), ["uniguajira.edu.co"]);
    assert.deepEqual(parseAllowedEmailDomains("  "), ["uniguajira.edu.co"]);
  });

  it("normaliza la lista y rechaza valores invalidos", () => {
    assert.deepEqual(parseAllowedEmailDomains(" @UniGuajira.edu.co "), ["uniguajira.edu.co"]);
    assert.throws(() => parseAllowedEmailDomains("*"));
    assert.throws(() => parseAllowedEmailDomains("gmail"));
    assert.throws(() => parseAllowedEmailDomains(","));
  });
});
