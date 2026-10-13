import { randomUUID } from "node:crypto";

import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";

import { User } from "../users/user.entity";

@Entity({ name: "sessions" })
export class Session {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  // Solo se guarda el hash SHA-256 del token; el valor en claro viaja unicamente en la cookie.
  @Column({ name: "token_hash", type: "varchar", length: 64, unique: true })
  tokenHash!: string;

  // Hash del token CSRF ligado a esta sesion (sincronizador). Nulo solo en sesiones anteriores a I-05.
  @Column({ name: "csrf_token_hash", type: "varchar", length: 64, nullable: true })
  csrfTokenHash!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @Column({ name: "expires_at", type: Date })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: Date, nullable: true })
  revokedAt!: Date | null;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
