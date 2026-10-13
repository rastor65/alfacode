import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyClientIpHeaders, parseTrustedHops, resolveClientIp } from "./client-ip.mjs";

describe("resolveClientIp", () => {
  it("sin proxies delante usa el socket e ignora X-Forwarded-For del cliente", () => {
    assert.equal(
      resolveClientIp({ remoteAddress: "198.51.100.7", forwardedFor: "203.0.113.9", trustedHops: 0 }),
      "198.51.100.7",
    );
  });

  it("convierte IPv4 mapeadas en IPv6", () => {
    assert.equal(resolveClientIp({ remoteAddress: "::ffff:198.51.100.7", trustedHops: 0 }), "198.51.100.7");
    assert.equal(resolveClientIp({ remoteAddress: "::1", trustedHops: 0 }), "::1");
  });

  it("con un proxy de confianza toma la entrada que este agrego, no la inventada", () => {
    assert.equal(
      resolveClientIp({ remoteAddress: "10.0.0.2", forwardedFor: "203.0.113.9, 198.51.100.7", trustedHops: 1 }),
      "198.51.100.7",
    );
  });

  it("con dos proxies de confianza toma la penultima entrada", () => {
    assert.equal(
      resolveClientIp({
        remoteAddress: "10.0.0.3",
        forwardedFor: ["203.0.113.9, 198.51.100.7", "10.0.0.2"],
        trustedHops: 2,
      }),
      "198.51.100.7",
    );
  });

  it("si faltan entradas o no son IPs validas vuelve al socket", () => {
    assert.equal(resolveClientIp({ remoteAddress: "10.0.0.2", forwardedFor: "", trustedHops: 1 }), "10.0.0.2");
    assert.equal(
      resolveClientIp({ remoteAddress: "10.0.0.2", forwardedFor: "no-es-ip", trustedHops: 1 }),
      "10.0.0.2",
    );
  });
});

describe("applyClientIpHeaders", () => {
  it("deja una sola X-Forwarded-For y elimina las cabeceras inventables", () => {
    const request = {
      socket: { remoteAddress: "198.51.100.7" },
      headers: {
        "x-forwarded-for": "203.0.113.9",
        "x-real-ip": "203.0.113.9",
        forwarded: "for=203.0.113.9",
        cookie: "a=1",
      },
    };

    assert.equal(applyClientIpHeaders(request, 0), "198.51.100.7");
    assert.deepEqual(request.headers, { cookie: "a=1", "x-forwarded-for": "198.51.100.7" });
  });
});

describe("parseTrustedHops", () => {
  it("acepta enteros no negativos y rechaza el resto", () => {
    assert.equal(parseTrustedHops(undefined), 0);
    assert.equal(parseTrustedHops("2"), 2);
    assert.throws(() => parseTrustedHops("true"));
    assert.throws(() => parseTrustedHops("-1"));
  });
});
