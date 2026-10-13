import { randomBytes } from "node:crypto";

import { Injectable, type OnModuleInit } from "@nestjs/common";
import { argon2id, hash, needsRehash, verify } from "argon2";

import { ConcurrencyLimiter } from "../../common/concurrency-limiter";

/** Parametros Argon2id: 64 MiB, 3 iteraciones, paralelismo 4 (minimos recomendados por OWASP superados). */
const ARGON2_OPTIONS = { type: argon2id, memoryCost: 64 * 1024, timeCost: 3, parallelism: 4 } as const;

/**
 * Cada operacion reserva 64 MiB: como maximo 4 simultaneas (256 MiB) y 100 en espera;
 * por encima se responde 503 para que una rafaga de logins no agote la memoria.
 */
export const ARGON2_CONCURRENCY = { maxConcurrent: 4, maxQueued: 100 };

@Injectable()
export class PasswordService implements OnModuleInit {
  private readonly limiter = new ConcurrencyLimiter(ARGON2_CONCURRENCY.maxConcurrent, ARGON2_CONCURRENCY.maxQueued);
  private dummyHash?: Promise<string>;

  /** Precalcula el hash ficticio para que la primera peticion no sea mas lenta que las demas. */
  async onModuleInit() {
    await this.getDummyHash();
  }

  hash(password: string) {
    return this.limiter.run(() => hash(password, ARGON2_OPTIONS));
  }

  verify(passwordHash: string, password: string) {
    return this.limiter.run(async () => {
      try {
        return await verify(passwordHash, password);
      } catch {
        // Hash corrupto o en formato desconocido: se trata como credencial invalida.
        return false;
      }
    });
  }

  needsRehash(passwordHash: string) {
    try {
      return needsRehash(passwordHash, ARGON2_OPTIONS);
    } catch {
      return false;
    }
  }

  /**
   * Ejecuta una verificacion con el mismo costo cuando el correo no existe, para que el
   * tiempo de respuesta no revele si una cuenta esta registrada.
   */
  async verifyAgainstDummy(password: string) {
    await this.verify(await this.getDummyHash(), password);
    return false;
  }

  private getDummyHash() {
    this.dummyHash ??= this.hash(randomBytes(32).toString("base64url"));
    return this.dummyHash;
  }
}
