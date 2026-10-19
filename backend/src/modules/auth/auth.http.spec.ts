import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { Controller, Get, Post } from "@nestjs/common";
import { hash as argon2Hash, argon2id } from "argon2";
import type { DataSource } from "typeorm";

import {
  type HttpHarness,
  ORIGIN,
  PASSWORD,
  type RequestOptions,
  cookiePairs,
  findSetCookie,
  startHttpHarness,
} from "../../testing/http-harness";
import { User } from "../users/user.entity";
import { RequireRoles } from "./auth.decorators";
import { LOGIN_RATE_LIMITS } from "./auth.service";
import { Session } from "./session.entity";
import { hashSessionToken } from "./sessions.service";

@Controller("test-only")
class TestOnlyController {
  @RequireRoles("admin")
  @Get("admin")
  admin() {
    return { ok: true };
  }

  @Post("mutate")
  mutate() {
    return { ok: true };
  }
}

let harness: HttpHarness;
let dataSource: DataSource;
let baseUrl: string;

const freshIp = () => harness.freshIp();
const request = (path: string, options?: RequestOptions) => harness.request(path, options);
const createUser = (...args: Parameters<HttpHarness["createUser"]>) => harness.createUser(...args);
const login = (...args: Parameters<HttpHarness["login"]>) => harness.login(...args);
const loginOk = (email: string) => harness.loginOk(email);

before(async () => {
  harness = await startHttpHarness({ controllers: [TestOnlyController] });
  dataSource = harness.dataSource;
  baseUrl = harness.baseUrl;
});

after(async () => {
  await harness?.close();
});

describe("cabeceras y errores", () => {
  it("health es publico y lleva cabeceras de seguridad", async () => {
    const { response } = await request("/health");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-powered-by"), null);
  });

  it("las rutas son privadas por defecto", async () => {
    const { response, json } = await request("/auth/me");

    assert.equal(response.status, 401);
    assert.deepEqual(json, { code: "UNAUTHENTICATED", message: "Se requiere una sesion valida", details: null });
  });

  it("responde 404 con el formato comun", async () => {
    const { response, json } = await request("/no-existe");

    assert.equal(response.status, 404);
    assert.deepEqual(json, { code: "NOT_FOUND", message: "Recurso no encontrado", details: null });
  });

  it("JSON mal formado devuelve 400 sin trazas", async () => {
    const { response, json, text } = await request("/auth/login", { method: "POST", rawBody: "{malo" });

    assert.equal(response.status, 400);
    assert.equal(json.code, "BAD_REQUEST");
    assert.doesNotMatch(text, /at |SyntaxError|node_modules/);
  });

  it("CORS solo autoriza el origen configurado, con credenciales", async () => {
    const allowed = await fetch(`${baseUrl}/api/v1/health`, { headers: { Origin: ORIGIN } });
    const denied = await fetch(`${baseUrl}/api/v1/health`, { headers: { Origin: "https://evil.example" } });

    assert.equal(allowed.headers.get("access-control-allow-origin"), ORIGIN);
    assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
  });
});

describe("POST /auth/login", () => {
  it("exige un origen autorizado", async () => {
    await createUser("origen@uniguajira.edu.co");

    const missing = await login("origen@uniguajira.edu.co", PASSWORD, { origin: null });
    const evil = await login("origen@uniguajira.edu.co", PASSWORD, { origin: "https://evil.example" });

    assert.equal(missing.response.status, 403);
    assert.equal(missing.json.code, "ORIGIN_NOT_ALLOWED");
    assert.equal(evil.response.status, 403);
  });

  it("valida el cuerpo, rechaza propiedades extra y no devuelve la contrasena", async () => {
    const extra = await request("/auth/login", {
      method: "POST",
      body: { email: "a@uniguajira.edu.co", password: "secreto-visible", role: "admin" },
    });
    const invalid = await request("/auth/login", { method: "POST", body: { email: "no-es-correo" } });
    const notObject = await request("/auth/login", { method: "POST", body: ["x"] });

    assert.equal(extra.response.status, 400);
    assert.equal(extra.json.code, "VALIDATION_ERROR");
    assert.doesNotMatch(extra.text, /secreto-visible/);
    assert.deepEqual(
      invalid.json.details.map((detail: { field: string }) => detail.field).sort(),
      ["email", "password"],
    );
    assert.equal(notObject.response.status, 400);
  });

  it("no distingue entre correo inexistente y contrasena incorrecta", async () => {
    await createUser("existe@uniguajira.edu.co");

    const wrongPassword = await login("existe@uniguajira.edu.co", "otra-clave");
    const unknown = await login("no-existe@uniguajira.edu.co", "otra-clave");

    assert.equal(wrongPassword.response.status, 401);
    assert.deepEqual(wrongPassword.json, unknown.json);
    assert.equal(unknown.json.code, "INVALID_CREDENTIALS");
  });

  it("rechaza cuentas pendientes, inactivas o sin correo verificado", async () => {
    await createUser("pendiente@uniguajira.edu.co", { status: "pending" });
    await createUser("inactiva@uniguajira.edu.co", { status: "inactive" });
    await createUser("noverificada@uniguajira.edu.co", { verified: false });

    for (const email of ["pendiente@uniguajira.edu.co", "inactiva@uniguajira.edu.co", "noverificada@uniguajira.edu.co"]) {
      const { response, json } = await login(email);
      assert.equal(response.status, 403, email);
      assert.equal(json.code, "ACCOUNT_NOT_ACTIVE");
      assert.equal(response.headers.getSetCookie().length, 0);
    }
  });

  it("crea una sesion con cookie HttpOnly y token CSRF", async () => {
    await createUser("ok@uniguajira.edu.co");

    const { response, json } = await login("  OK@Uniguajira.EDU.CO ");
    const sessionCookie = findSetCookie(response, "alfacode_session")!;
    const csrfCookie = findSetCookie(response, "alfacode_csrf")!;
    const token = sessionCookie.split(";")[0].split("=")[1];

    assert.equal(response.status, 200);
    assert.match(sessionCookie, /HttpOnly/i);
    assert.match(sessionCookie, /SameSite=Lax/i);
    assert.match(sessionCookie, /Secure/i);
    assert.match(sessionCookie, /Path=\//);
    assert.match(sessionCookie, /Expires=/);
    assert.doesNotMatch(csrfCookie, /HttpOnly/i);
    assert.equal(csrfCookie.split(";")[0].split("=")[1], json.csrfToken);
    assert.deepEqual(Object.keys(json.user).sort(), [
      "accountStatus",
      "email",
      "fullName",
      "id",
      "menu",
      "mustChangePassword",
      "resources",
      "roles",
    ]);
    assert.equal(json.user.email, "ok@uniguajira.edu.co");

    const stored = await dataSource.getRepository(Session).findOneByOrFail({ tokenHash: hashSessionToken(token) });
    assert.notEqual(stored.tokenHash, token);
    assert.equal(stored.csrfTokenHash, hashSessionToken(json.csrfToken));
  });

  it("revoca la sesion anterior del navegador al volver a iniciar sesion", async () => {
    await createUser("rotacion@uniguajira.edu.co");
    const first = await loginOk("rotacion@uniguajira.edu.co");

    const second = await login("rotacion@uniguajira.edu.co", PASSWORD, { cookies: first.cookies });

    assert.equal(second.response.status, 200);
    assert.equal((await request("/auth/me", { cookies: first.cookies })).response.status, 401);
    assert.equal((await request("/auth/me", { cookies: cookiePairs(second.response) })).response.status, 200);
  });

  it("actualiza hashes con parametros debiles al iniciar sesion", async () => {
    const weak = await argon2Hash(PASSWORD, { type: argon2id, memoryCost: 8192, timeCost: 2, parallelism: 1 });
    const user = await createUser("rehash@uniguajira.edu.co", { hash: weak });

    await loginOk("rehash@uniguajira.edu.co");

    const stored = await dataSource
      .getRepository(User)
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id: user.id })
      .getOneOrFail();
    assert.notEqual(stored.passwordHash, weak);
    assert.match(stored.passwordHash, /^\$argon2id\$v=19\$m=65536,p=4,t=3\$/);
  });
});

describe("limites de intentos", () => {
  async function failTimes(email: string, times: number, ip?: () => string) {
    for (let attempt = 0; attempt < times; attempt += 1) {
      const { response } = await login(email, "incorrecta", { ip: ip?.() });
      assert.equal(response.status, 401, `intento ${attempt + 1}`);
    }
  }

  it("bloquea cuenta+IP tras 5 fallos sin bloquear al dueno desde otra red", async () => {
    await createUser("victima@uniguajira.edu.co");
    const attackerIp = freshIp();

    await failTimes("victima@uniguajira.edu.co", LOGIN_RATE_LIMITS.perAccountIp, () => attackerIp);

    const attacker = await login("victima@uniguajira.edu.co", PASSWORD, { ip: attackerIp });
    const owner = await login("victima@uniguajira.edu.co", PASSWORD, { ip: freshIp() });

    assert.equal(attacker.response.status, 429);
    assert.equal(attacker.json.code, "TOO_MANY_REQUESTS");
    assert.ok(Number(attacker.response.headers.get("retry-after")) > 0);
    assert.equal(owner.response.status, 200);
  });

  it("limita los fallos sobre una cuenta desde muchas IPs", async () => {
    await createUser("distribuido@uniguajira.edu.co");

    await failTimes("distribuido@uniguajira.edu.co", LOGIN_RATE_LIMITS.perAccount, freshIp);

    assert.equal((await login("distribuido@uniguajira.edu.co", PASSWORD)).response.status, 429);
  });

  it("limita el rociado de contrasenas desde una IP, ignorando IPs inventadas por el cliente", async () => {
    const ip = freshIp();

    for (let attempt = 0; attempt < LOGIN_RATE_LIMITS.perIp; attempt += 1) {
      const { response } = await login(`cuenta-${attempt}@uniguajira.edu.co`, "incorrecta", { ip });
      assert.equal(response.status, 401, `intento ${attempt + 1}`);
    }

    assert.equal((await login("cuenta-extra@uniguajira.edu.co", "incorrecta", { ip })).response.status, 429);
  });

  it("los inicios de sesion correctos no consumen los limites (redes compartidas)", async () => {
    await createUser("campus@uniguajira.edu.co");
    const sharedIp = freshIp();

    for (let attempt = 0; attempt < LOGIN_RATE_LIMITS.perAccountIp + 2; attempt += 1) {
      assert.equal((await login("campus@uniguajira.edu.co", PASSWORD, { ip: sharedIp })).response.status, 200);
    }
  });
});

describe("sesion, CSRF y roles", () => {
  it("GET /auth/me devuelve el usuario sin datos sensibles", async () => {
    await createUser("me@uniguajira.edu.co", { roles: ["researcher", "student"] });
    const { cookies } = await loginOk("me@uniguajira.edu.co");

    const { response, json, text } = await request("/auth/me", { cookies });

    assert.equal(response.status, 200);
    assert.deepEqual(json.roles, ["researcher", "student"]);
    assert.doesNotMatch(text, /argon2|passwordHash|tokenHash/);
  });

  it("las operaciones mutables exigen el token CSRF de la propia sesion", async () => {
    await createUser("csrf-a@uniguajira.edu.co");
    await createUser("csrf-b@uniguajira.edu.co");
    const a = await loginOk("csrf-a@uniguajira.edu.co");
    const b = await loginOk("csrf-b@uniguajira.edu.co");

    const missing = await request("/test-only/mutate", { method: "POST", cookies: a.cookies });
    const foreign = await request("/test-only/mutate", { method: "POST", cookies: a.cookies, csrf: b.csrf });
    const valid = await request("/test-only/mutate", { method: "POST", cookies: a.cookies, csrf: a.csrf });
    const noOrigin = await request("/test-only/mutate", {
      method: "POST",
      cookies: a.cookies,
      csrf: a.csrf,
      origin: null,
    });

    assert.equal(missing.response.status, 403);
    assert.equal(missing.json.code, "CSRF_TOKEN_INVALID");
    assert.equal(foreign.response.status, 403);
    assert.equal(valid.response.status, 201);
    assert.equal(noOrigin.json.code, "ORIGIN_NOT_ALLOWED");
  });

  it("aplica roles en el backend", async () => {
    await createUser("estudiante@uniguajira.edu.co", { roles: ["student"] });
    await createUser("admin@uniguajira.edu.co", { roles: ["admin"] });
    const student = await loginOk("estudiante@uniguajira.edu.co");
    const admin = await loginOk("admin@uniguajira.edu.co");

    const denied = await request("/test-only/admin", { cookies: student.cookies });
    const allowed = await request("/test-only/admin", { cookies: admin.cookies });

    assert.equal(denied.response.status, 403);
    assert.equal(denied.json.code, "FORBIDDEN");
    assert.equal(allowed.response.status, 200);
  });

  it("un usuario desactivado pierde el acceso de inmediato", async () => {
    const user = await createUser("desactivado@uniguajira.edu.co");
    const { cookies } = await loginOk("desactivado@uniguajira.edu.co");

    await dataSource.getRepository(User).update({ id: user.id }, { accountStatus: "inactive" });

    assert.equal((await request("/auth/me", { cookies })).response.status, 401);
  });

  it("logout exige CSRF, revoca la sesion y borra las cookies", async () => {
    await createUser("logout@uniguajira.edu.co");
    const { cookies, csrf } = await loginOk("logout@uniguajira.edu.co");

    const withoutCsrf = await request("/auth/logout", { method: "POST", cookies });
    const { response } = await request("/auth/logout", { method: "POST", cookies, csrf });

    assert.equal(withoutCsrf.response.status, 403);
    assert.equal(response.status, 204);
    assert.match(findSetCookie(response, "alfacode_session")!, /Expires=Thu, 01 Jan 1970/);
    assert.match(findSetCookie(response, "alfacode_csrf")!, /Expires=Thu, 01 Jan 1970/);
    assert.equal((await request("/auth/me", { cookies })).response.status, 401);
  });
});
