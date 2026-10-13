import { randomUUID } from "node:crypto";

import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { Role } from "../roles/role.entity";

export const ACCOUNT_STATUSES = ["pending", "active", "inactive", "rejected"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

@Entity({ name: "users" })
export class User {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "full_name", type: "varchar", length: 160 })
  fullName!: string;

  @Column({ name: "email_normalized", type: "varchar", length: 254, unique: true })
  emailNormalized!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255, select: false })
  passwordHash!: string;

  @Column({ name: "account_status", type: "varchar", length: 20, default: "pending" })
  accountStatus!: AccountStatus;

  @Column({ name: "email_verified_at", type: Date, nullable: true })
  emailVerifiedAt!: Date | null;

  /** Contrasena temporal: el backend bloquea todo salvo cambiarla (DEC-016). */
  @Column({ name: "must_change_password", type: Boolean, default: false })
  mustChangePassword!: boolean;

  /** Vencimiento de la contrasena temporal; nulo cuando la persona eligio la suya. */
  @Column({ name: "password_expires_at", type: Date, nullable: true })
  passwordExpiresAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @ManyToMany(() => Role)
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
  })
  roles!: Role[];

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
