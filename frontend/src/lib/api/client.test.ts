import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { apiRequest, apiUpload, readCookie } from "./client";
import { ApiRequestError, NETWORK_ERROR_CODE, describeError, invalidFields } from "./errors";

type Captured = { url: string; init: RequestInit };

const originalFetch = globalThis.fetch;
let captured: Captured[] = [];

function mockFetch(response: () => Response | Promise<Response>) {
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    captured.push({ url, init });
    return response();
  }) as typeof fetch;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  captured = [];
  (globalThis as { document?: { cookie: string } }).document = {
    cookie: "otra=1; alfacode_csrf=token%2Dcsrf; alfacode_session=no-se-lee",
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete (globalThis as { document?: unknown }).document;
});

describe("apiRequest", () => {
  it("envia JSON al mismo origen con el token CSRF en operaciones mutables", async () => {
    mockFetch(() => json(200, { ok: true }));

    const result = await apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST", body: { a: 1 } });
    const { url, init } = captured[0];
    const headers = init.headers as Record<string, string>;

    assert.deepEqual(result, { ok: true });
    assert.equal(url, "/api/v1/auth/logout");
    assert.equal(init.credentials, "same-origin");
    assert.equal(headers["X-CSRF-Token"], "token-csrf");
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(init.body, JSON.stringify({ a: 1 }));
  });

  it("no envia el token CSRF en lecturas", async () => {
    mockFetch(() => json(200, {}));

    await apiRequest("/auth/me");

    assert.equal((captured[0].init.headers as Record<string, string>)["X-CSRF-Token"], undefined);
  });

  it("convierte las respuestas de error del backend en ApiRequestError", async () => {
    mockFetch(() => json(429, { code: "TOO_MANY_REQUESTS", message: "x", details: { retryAfterSeconds: 61 } }));

    await assert.rejects(apiRequest("/auth/login", { method: "POST", body: {} }), (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.status, 429);
      assert.equal(describeError(error), "Demasiados intentos. Intenta de nuevo en 2 minutos.");
      return true;
    });
  });

  it("tolera respuestas sin cuerpo o que no son JSON", async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    assert.equal(await apiRequest("/auth/logout", { method: "POST" }), null);

    mockFetch(() => new Response("<html>Bad gateway</html>", { status: 502 }));
    await assert.rejects(apiRequest("/auth/me"), (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.code, "HTTP_ERROR");
      return true;
    });
  });

  it("informa los fallos de red con un codigo propio", async () => {
    mockFetch(() => {
      throw new TypeError("fetch failed");
    });

    await assert.rejects(apiRequest("/auth/me"), (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.code, NETWORK_ERROR_CODE);
      assert.match(describeError(error), /No se pudo conectar/);
      return true;
    });
  });
});

describe("errores", () => {
  it("usa mensajes propios para los codigos frecuentes y el del backend para el resto", () => {
    assert.equal(describeError(new ApiRequestError(401, "INVALID_CREDENTIALS", "x")), "Correo o contraseña incorrectos.");
    assert.equal(describeError(new ApiRequestError(409, "OTRO_CODIGO", "Mensaje del backend")), "Mensaje del backend");
    assert.equal(describeError(new Error("x")), "Ocurrió un error inesperado. Intenta de nuevo.");
  });

  it("extrae los campos invalidos de un error de validacion", () => {
    const error = new ApiRequestError(400, "VALIDATION_ERROR", "x", [
      { field: "email", rules: ["isEmail"] },
      { field: "password", rules: ["minLength"] },
    ]);

    assert.deepEqual(invalidFields(error), ["email", "password"]);
    assert.deepEqual(invalidFields(new Error("x")), []);
  });

  it("lee cookies por nombre exacto", () => {
    assert.equal(readCookie("a=1; alfacode_csrf=abc", "alfacode_csrf"), "abc");
    assert.equal(readCookie("xalfacode_csrf=abc", "alfacode_csrf"), undefined);
    assert.equal(readCookie("alfacode_csrf=%E0%A4%A", "alfacode_csrf"), undefined);
  });
});

describe("apiUpload", () => {
  it("envia el formulario tal cual, sin Content-Type JSON y con el token CSRF", async () => {
    mockFetch(() => json(201, { id: "1" }));
    const form = new FormData();
    form.append("title", "Acta");

    const result = await apiUpload<{ id: string }>("/documents", form);
    const { url, init } = captured[0];
    const headers = init.headers as Record<string, string>;

    assert.deepEqual(result, { id: "1" });
    assert.equal(url, "/api/v1/documents");
    assert.equal(init.method, "POST");
    assert.equal(init.body, form);
    assert.equal(headers["Content-Type"], undefined);
    assert.equal(headers["X-CSRF-Token"], "token-csrf");
  });

  it("convierte los errores igual que apiRequest", async () => {
    mockFetch(() => json(415, { code: "FILE_CONTENT_MISMATCH", message: "x" }));

    await assert.rejects(apiUpload("/documents", new FormData()), (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.code, "FILE_CONTENT_MISMATCH");
      return true;
    });
  });
});
