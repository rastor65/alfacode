import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { loadSecurityConfig, productionConfigErrors } from "./security.config";

const KEYS = [
  "TRUST_PROXY",
  "NODE_ENV",
  "CORS_ORIGINS",
  "SESSION_CLEANUP_INTERVAL_MS",
  "APP_PUBLIC_URL",
  "MAIL_TRANSPORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
] as const;
const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
});

describe("loadSecurityConfig", () => {
  it("fuera de produccion solo confia en el proxy local por defecto", () => {
    process.env.TRUST_PROXY = "";
    assert.equal(loadSecurityConfig().trustProxy, "loopback");
  });

  it("interpreta TRUST_PROXY numerico y booleano", () => {
    process.env.TRUST_PROXY = "1";
    assert.equal(loadSecurityConfig().trustProxy, 1);
    process.env.TRUST_PROXY = "true";
    assert.equal(loadSecurityConfig().trustProxy, true);
  });

  it("solo desactiva Secure en development", () => {
    process.env.NODE_ENV = "development";
    assert.equal(loadSecurityConfig().secureCookies, false);
    process.env.NODE_ENV = "production";
    process.env.TRUST_PROXY = "1";
    process.env.CORS_ORIGINS = "https://hub.example.test";
    process.env.APP_PUBLIC_URL = "https://hub.example.test";
    delete process.env.MAIL_TRANSPORT;
    assert.equal(loadSecurityConfig().secureCookies, true);
    assert.equal(loadSecurityConfig().mailTransport, "none");
    process.env.NODE_ENV = "test";
    assert.equal(loadSecurityConfig().secureCookies, true);
  });

  it("normaliza la lista de origenes", () => {
    process.env.CORS_ORIGINS = " http://localhost:3000/ , https://hub.example.test ";
    assert.deepEqual(loadSecurityConfig().allowedOrigins, ["http://localhost:3000", "https://hub.example.test"]);
  });
});

describe("configuracion de produccion", () => {
  it("no arranca sin TRUST_PROXY ni CORS_ORIGINS explicitos", () => {
    process.env.NODE_ENV = "production";
    delete process.env.TRUST_PROXY;
    delete process.env.CORS_ORIGINS;

    assert.throws(() => loadSecurityConfig(), /TRUST_PROXY[\s\S]*CORS_ORIGINS/);
  });

  it("exige origenes https", () => {
    assert.deepEqual(
      productionConfigErrors({
        TRUST_PROXY: "1",
        CORS_ORIGINS: "https://hub.example.test, http://hub.example.test",
        APP_PUBLIC_URL: "https://hub.example.test",
      }),
      ["CORS_ORIGINS solo admite origenes https:// en produccion"],
    );
  });

  it("acepta TRUST_PROXY=false explicito cuando no hay proxy inverso", () => {
    assert.deepEqual(
      productionConfigErrors({
        TRUST_PROXY: "false",
        CORS_ORIGINS: "https://hub.example.test",
        APP_PUBLIC_URL: "https://hub.example.test",
      }),
      [],
    );
  });

  it("admite SMTP real y exige sus credenciales al arrancar", () => {
    assert.deepEqual(
      productionConfigErrors({
        TRUST_PROXY: "1",
        CORS_ORIGINS: "https://hub.example.test",
        APP_PUBLIC_URL: "https://hub.example.test",
        MAIL_TRANSPORT: "smtp",
      }),
      [],
    );

    process.env.NODE_ENV = "development";
    process.env.MAIL_TRANSPORT = "smtp";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    assert.throws(() => loadSecurityConfig(), /SMTP_USER/);

    process.env.SMTP_USER = "hub@uniguajira.edu.co";
    process.env.SMTP_PASSWORD = "abcd efgh ijkl mnop";
    assert.equal(loadSecurityConfig().smtp?.password, "abcdefghijklmnop");
  });

  it("no admite guardar correos con tokens fuera de un buzon real", () => {
    const errors = productionConfigErrors({
      TRUST_PROXY: "1",
      CORS_ORIGINS: "https://hub.example.test",
      APP_PUBLIC_URL: "http://hub.example.test",
      MAIL_TRANSPORT: "outbox",
    });

    assert.equal(errors.length, 2);
    assert.match(errors.join(" "), /APP_PUBLIC_URL/);
    assert.match(errors.join(" "), /MAIL_TRANSPORT/);
  });
});
