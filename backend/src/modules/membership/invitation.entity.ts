import { randomUUID } from "node:crypto";

import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { Role } from "../roles/role.entity";

@Entity({ name: "invitations" })
export class Invitation {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "email_normalized", type: "varchar", length: 254 })
  emailNormalized!: string;

  @Column({ name: "role_id", type: "varchar", length: 36 })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  // Solo se guarda el hash del token de invitacion; el enlace en claro no se persiste ni se registra.
  @Column({ name: "token_hash", type: "varchar", length: 64, unique: true })
  tokenHash!: string;

  @Column({ name: "invited_by", type: "varchar", length: 36, nullable: true })
  invitedBy!: string | null;

  @Column({ name: "expires_at", type: Date })
  expiresAt!: Date;

  @Column({ name: "accepted_at", type: Date, nullable: true })
  acceptedAt!: Date | null;

  @Column({ name: "accepted_user_id", type: "varchar", length: 36, nullable: true })
  acceptedUserId!: string | null;

  @Column({ name: "revoked_at", type: Date, nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
