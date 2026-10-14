import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { DataSourceOptions } from "typeorm";

import { AuditEvent } from "../modules/audit/audit-event.entity";
import { Session } from "../modules/auth/session.entity";
import { VerificationToken } from "../modules/auth/verification-token.entity";
import { Invitation } from "../modules/membership/invitation.entity";
import { MembershipRequest } from "../modules/membership/membership-request.entity";
import { ProjectMember } from "../modules/projects/project-member.entity";
import { Project } from "../modules/projects/project.entity";
import { Role } from "../modules/roles/role.entity";
import { User } from "../modules/users/user.entity";
import { SchemaBootstrap1728690000000 } from "./migrations/1728690000000-schema-bootstrap";
import { IdentityBase1728700000000 } from "./migrations/1728700000000-identity-base";
import { IdentityFlows1728710000000 } from "./migrations/1728710000000-identity-flows";
import { AuditEvents1728720000000 } from "./migrations/1728720000000-audit-events";
import { PasswordLifecycle1728730000000 } from "./migrations/1728730000000-password-lifecycle";
import { ProjectsAndTeams1728740000000 } from "./migrations/1728740000000-projects-and-teams";
import { MembershipRequestCv1728750000000 } from "./migrations/1728750000000-membership-request-cv";

export const entities = [
  User,
  Role,
  Session,
  MembershipRequest,
  Invitation,
  VerificationToken,
  AuditEvent,
  Project,
  ProjectMember,
];

export const migrations = [
  SchemaBootstrap1728690000000,
  IdentityBase1728700000000,
  IdentityFlows1728710000000,
  AuditEvents1728720000000,
  PasswordLifecycle1728730000000,
  ProjectsAndTeams1728740000000,
  MembershipRequestCv1728750000000,
];

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function loadDatabaseEnv() {
  // Dentro de `node --test` no se leen los .env locales: las pruebas no deben depender de la
  // configuracion (ni de las credenciales) de quien las ejecuta.
  if (process.env.NODE_TEST_CONTEXT) {
    return;
  }

  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));
}

export function createDataSourceOptions(): DataSourceOptions {
  loadDatabaseEnv();

  const dbType = process.env.DB_TYPE ?? "sqlite";

  if (dbType === "postgres") {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error("DATABASE_URL is required when DB_TYPE=postgres");
    }

    return {
      type: "postgres",
      url,
      entities,
      migrations,
      synchronize: false,
    };
  }

  if (dbType === "sqlite") {
    const sqlitePath = process.env.SQLITE_PATH ?? "./data/alfacode-hub.sqlite";
    // ":memory:" se usa en pruebas HTTP aisladas; no crea archivos.
    const database = sqlitePath === ":memory:" ? sqlitePath : resolve(process.cwd(), sqlitePath);

    if (database !== ":memory:") {
      mkdirSync(dirname(database), { recursive: true });
    }

    return {
      type: "better-sqlite3",
      database,
      entities,
      migrations,
      synchronize: false,
    };
  }

  throw new Error(`Unsupported DB_TYPE: ${dbType}`);
}
