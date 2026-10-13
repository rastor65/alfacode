import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { Module, type Type } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DataSource } from "typeorm";

import { AppModule } from "../app.module";
import { configureApp } from "../app.setup";
import { seedRoles } from "../database/seeds/roles.seed";
import { PasswordService } from "../modules/auth/password.service";
import { Role, type RoleCode } from "../modules/roles/role.entity";
import { type AccountStatus, User } from "../modules/users/user.entity";

/** Arnes de pruebas HTTP: la app real sobre SQLite en memoria con las migraciones reales. */
export const ORIGIN = "http://localhost:3000";
export const PASSWORD = "Contrasena-Ficticia-123";

export interface RequestOptions {
  method?: string;
  body?: unknown;
  rawBody?: string;
  cookies?: string[];
  csrf?: string;
  origin?: string | null;
  ip?: string;
}

export function cookiePairs(response: Response) {
  return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]);
}

export function findSetCookie(response: Response, name: string) {
  return response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${name}=`));
}

export async function startHttpHarness(options: { controllers?: Type[]; env?: Record<string, string> } = {}) {
  Object.assign(process.env, {
    SQLITE_PATH: ":memory:",
    NODE_ENV: "test",
    CORS_ORIGINS: ORIGIN,
    SESSION_CLEANUP_INTERVAL_MS: "0",
    // Simula un proxy inverso de confianza que agrega la IP real al final de X-Forwarded-For.
    TRUST_PROXY: "1",
    MAIL_TRANSPORT: "memory",
    APP_PUBLIC_URL: ORIGIN,
    ...options.env,
  });

  @Module({ imports: [AppModule], controllers: options.controllers ?? [] })
  class TestAppModule {}

  const app = configureApp(await NestFactory.create<NestExpressApplication>(TestAppModule, { logger: false }));
  await app.listen(0, "127.0.0.1");
  const baseUrl = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations({ transaction: "all" });
  await seedRoles(dataSource);
  const passwordHash = await app.get(PasswordService).hash(PASSWORD);

  let ipCounter = 0;

  /** Cada llamada devuelve una IP distinta para aislar los limites entre pruebas. */
  function freshIp() {
    ipCounter += 1;
    return `198.51.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
  }

  async function request(path: string, requestOptions: RequestOptions = {}) {
    // La entrada de la izquierda imita una IP inventada por el cliente y debe ignorarse.
    const spoofed = `203.0.113.${Math.floor(Math.random() * 250)}`;
    const headers: Record<string, string> = { "X-Forwarded-For": `${spoofed}, ${requestOptions.ip ?? freshIp()}` };

    if (requestOptions.origin !== null) {
      headers.Origin = requestOptions.origin ?? ORIGIN;
    }
    if (requestOptions.body !== undefined || requestOptions.rawBody !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (requestOptions.cookies?.length) {
      headers.Cookie = requestOptions.cookies.join("; ");
    }
    if (requestOptions.csrf) {
      headers["X-CSRF-Token"] = requestOptions.csrf;
    }

    const response = await fetch(`${baseUrl}/api/v1${path}`, {
      method: requestOptions.method ?? "GET",
      headers,
      body:
        requestOptions.rawBody ?? (requestOptions.body === undefined ? undefined : JSON.stringify(requestOptions.body)),
    });
    const text = await response.text();

    return { response, text, json: text ? JSON.parse(text) : null };
  }

  async function createUser(
    email: string,
    userOptions: { status?: AccountStatus; verified?: boolean; roles?: RoleCode[]; hash?: string } = {},
  ) {
    const repository = dataSource.getRepository(User);
    const roles = await dataSource.getRepository(Role).find();

    return repository.save(
      repository.create({
        fullName: "Persona Ficticia",
        emailNormalized: email,
        passwordHash: userOptions.hash ?? passwordHash,
        accountStatus: userOptions.status ?? "active",
        emailVerifiedAt: userOptions.verified === false ? null : new Date(),
        roles: roles.filter((role) => (userOptions.roles ?? ["student"]).includes(role.code)),
      }),
    );
  }

  async function login(email: string, password = PASSWORD, extra: RequestOptions = {}) {
    return request("/auth/login", { method: "POST", body: { email, password }, ...extra });
  }

  /** Inicia sesion y devuelve lo necesario para peticiones autenticadas (cookies + CSRF). */
  async function loginOk(email: string, password = PASSWORD) {
    const result = await login(email, password);
    assert.equal(result.response.status, 200, result.text);
    return { cookies: cookiePairs(result.response), csrf: result.json.csrfToken as string };
  }

  return { app, dataSource, baseUrl, freshIp, request, createUser, login, loginOk, close: () => app.close() };
}

export type HttpHarness = Awaited<ReturnType<typeof startHttpHarness>>;
