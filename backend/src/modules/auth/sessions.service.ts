import { timingSafeEqual } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, LessThan, Repository } from "typeorm";

import { generateSecureToken, hashToken } from "../../common/tokens";
import { Session } from "./session.entity";

/** Duracion fija de 7 dias, sin renovacion silenciosa (plan-desarrollo, seccion 2.3). */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const hashSessionToken = hashToken;

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessions: Repository<Session>,
  ) {}

  /**
   * Crea una sesion y devuelve el token de sesion y el token CSRF en claro una sola vez;
   * solo sus hashes se persisten.
   */
  async create(userId: string, now = new Date()) {
    const token = generateSecureToken();
    const csrfToken = generateSecureToken();
    const session = await this.sessions.save(
      this.sessions.create({
        userId,
        tokenHash: hashSessionToken(token),
        csrfTokenHash: hashSessionToken(csrfToken),
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
        revokedAt: null,
      }),
    );

    return { token, csrfToken, session };
  }

  /** Devuelve la sesion solo si no esta revocada ni vencida y el usuario sigue activo y verificado. */
  async findValid(token: string, now = new Date()) {
    const session = await this.sessions.findOne({
      where: { tokenHash: hashSessionToken(token) },
      relations: { user: { roles: true } },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt.getTime() <= now.getTime() ||
      session.user.accountStatus !== "active" ||
      session.user.emailVerifiedAt === null
    ) {
      return null;
    }

    return session;
  }

  /** Compara en tiempo constante el token CSRF recibido con el hash ligado a la sesion. */
  matchesCsrfToken(session: Session, csrfToken: string | undefined) {
    if (!session.csrfTokenHash || !csrfToken) {
      return false;
    }

    const expected = Buffer.from(session.csrfTokenHash, "hex");
    const received = Buffer.from(hashSessionToken(csrfToken), "hex");

    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  async revoke(token: string, now = new Date()) {
    await this.sessions.update(
      { tokenHash: hashSessionToken(token), revokedAt: IsNull() },
      { revokedAt: now },
    );
  }

  async revokeById(id: string, now = new Date()) {
    await this.sessions.update({ id, revokedAt: IsNull() }, { revokedAt: now });
  }

  async revokeAllForUser(userId: string, now = new Date()) {
    await this.sessions.update({ userId, revokedAt: IsNull() }, { revokedAt: now });
  }

  /** Elimina sesiones vencidas (revocadas o no); devuelve cuantas se borraron. */
  async deleteExpired(now = new Date()) {
    const result = await this.sessions.delete({ expiresAt: LessThan(now) });
    return result.affected ?? 0;
  }
}
