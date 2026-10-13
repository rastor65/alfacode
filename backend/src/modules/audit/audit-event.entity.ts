import { randomUUID } from "node:crypto";

import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "audit_events" })
export class AuditEvent {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  /** Nulo cuando la accion no la hizo un usuario con sesion (p. ej. bootstrap por consola). */
  @Column({ name: "actor_user_id", type: "varchar", length: 36, nullable: true })
  actorUserId!: string | null;

  @Column({ type: "varchar", length: 60 })
  action!: string;

  @Column({ name: "target_type", type: "varchar", length: 40 })
  targetType!: string;

  @Column({ name: "target_id", type: "varchar", length: 36 })
  targetId!: string;

  /** JSON sin secretos (nunca contrasenas, tokens ni hashes). */
  @Column({ type: "text", nullable: true })
  details!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
