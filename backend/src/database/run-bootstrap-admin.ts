import { Writable } from "node:stream";
import { createInterface } from "node:readline/promises";

import { parseAllowedEmailDomains } from "../common/email-domain";
import { PasswordService } from "../modules/auth/password.service";
import { BootstrapAdminError, bootstrapAdmin } from "../modules/users/bootstrap-admin";
import { AppDataSource } from "./data-source";

/**
 * Comando interactivo de un solo uso para crear el primer administrador (F1-04).
 * Los datos se introducen en ejecucion; la contrasena no se muestra ni se registra.
 */
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  },
});

const rl = createInterface({ input: process.stdin, output, terminal: process.stdin.isTTY });
// El iterador conserva en bufer las lineas que lleguen antes de cada pregunta (entrada canalizada).
const lines = rl[Symbol.asyncIterator]();

async function readLine(prompt: string, { secret = false } = {}) {
  process.stdout.write(prompt);
  muted = secret;

  try {
    const next = await lines.next();

    if (next.done) {
      throw new BootstrapAdminError("Entrada incompleta: no se creo ningun administrador.");
    }

    return secret ? next.value : next.value.trim();
  } finally {
    if (secret) {
      muted = false;
      process.stdout.write("\n");
    }
  }
}

async function main() {
  const envEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const envPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  const envFullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() ?? "Administrador AlfaCode";

  if (envEmail && envPassword) {
    rl.close();
    console.log(`Bootstrap no interactivo del primer administrador: ${envEmail}`);
    await AppDataSource.initialize();

    try {
      const result = await bootstrapAdmin(
        AppDataSource,
        new PasswordService(),
        { fullName: envFullName, email: envEmail, password: envPassword },
        parseAllowedEmailDomains(process.env.ALLOWED_EMAIL_DOMAINS),
      );
      console.log(`Administrador creado con exito: ${result.email}`);
    } catch (error) {
      if (error instanceof BootstrapAdminError && error.message.includes("Ya existe un administrador")) {
        console.log("Ya existe un administrador en la base de datos; omitiendo creacion.");
        return;
      }
      throw error;
    } finally {
      await AppDataSource.destroy();
    }
    return;
  }

  console.log("Creacion del primer administrador de AlfaCode HUB (solo puede hacerse una vez).");

  const fullName = await readLine("Nombre completo: ");
  const email = await readLine("Correo: ");
  const password = await readLine("Contrasena (12 a 128 caracteres): ", { secret: true });
  const confirmation = await readLine("Repite la contrasena: ", { secret: true });
  rl.close();

  if (password !== confirmation) {
    throw new BootstrapAdminError("Las contrasenas no coinciden.");
  }

  await AppDataSource.initialize();

  try {
    const result = await bootstrapAdmin(
      AppDataSource,
      new PasswordService(),
      { fullName, email, password },
      parseAllowedEmailDomains(process.env.ALLOWED_EMAIL_DOMAINS),
    );
    console.log(`Administrador creado: ${result.email}`);
  } finally {
    await AppDataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  rl.close();
  console.error(error instanceof BootstrapAdminError ? `Error: ${error.message}` : error);
  process.exitCode = 1;
});
