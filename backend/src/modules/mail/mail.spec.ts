import assert from "node:assert/strict";
import { createServer } from "node:net";
import { describe, it } from "node:test";

import { ApiError } from "../../common/api-error";
import { deliverMail } from "./deliver";
import { MemoryMailer, SmtpMailer } from "./mailers";
import { parseSmtpConfig } from "./smtp.config";

describe("parseSmtpConfig", () => {
  it("usa Google por defecto y quita los espacios de la contrasena de aplicacion", () => {
    const config = parseSmtpConfig({ SMTP_USER: "hub@uniguajira.edu.co", SMTP_PASSWORD: "abcd efgh ijkl mnop" });

    assert.deepEqual(config, {
      host: "smtp.gmail.com",
      port: 465,
      user: "hub@uniguajira.edu.co",
      password: "abcdefghijklmnop",
      from: "AlfaCode HUB <hub@uniguajira.edu.co>",
    });
  });

  it("respeta host, puerto y remitente configurados", () => {
    const config = parseSmtpConfig({
      SMTP_HOST: "smtp.ejemplo.test",
      SMTP_PORT: "587",
      SMTP_USER: "u",
      SMTP_PASSWORD: "p",
      MAIL_FROM: "Semillero <u@uniguajira.edu.co>",
    });

    assert.equal(config.port, 587);
    assert.equal(config.host, "smtp.ejemplo.test");
    assert.equal(config.from, "Semillero <u@uniguajira.edu.co>");
  });

  it("no arranca sin usuario, contrasena o con un puerto invalido, y no muestra secretos", () => {
    assert.throws(() => parseSmtpConfig({}), /SMTP_USER[\s\S]*SMTP_PASSWORD/);
    assert.throws(
      () => parseSmtpConfig({ SMTP_USER: "u", SMTP_PASSWORD: "secreto-no-visible", SMTP_PORT: "99999" }),
      (error: unknown) => {
        assert.match(String(error), /SMTP_PORT/);
        assert.doesNotMatch(String(error), /secreto-no-visible/);
        return true;
      },
    );
  });
});

describe("SmtpMailer", () => {
  it("falla con un error de red si el servidor SMTP no responde", async () => {
    // Puerto libre en el que nadie escucha.
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as { port: number };
    await new Promise<void>((resolve) => server.close(() => resolve()));

    const mailer = new SmtpMailer({ host: "127.0.0.1", port, user: "u", password: "p", from: "x <x@uniguajira.edu.co>" });

    await assert.rejects(mailer.send({ to: "y@uniguajira.edu.co", subject: "s", text: "t" }), /ECONNREFUSED|connect/i);
  });
});

describe("deliverMail", () => {
  it("convierte cualquier fallo del transporte en 503 sin exponer el contenido", async () => {
    const mailer = new MemoryMailer();
    mailer.failNext = new Error("535 Username and Password not accepted");

    await assert.rejects(
      deliverMail(mailer, { to: "y@uniguajira.edu.co", subject: "s", text: "enlace #token=secreto" }),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.getStatus(), 503);
        assert.deepEqual(error.getResponse(), {
          code: "MAIL_DELIVERY_FAILED",
          message: "No pudimos enviar el correo. Intenta de nuevo en unos minutos.",
          details: null,
        });
        return true;
      },
    );
    assert.equal(mailer.messages.length, 0);
  });
});
