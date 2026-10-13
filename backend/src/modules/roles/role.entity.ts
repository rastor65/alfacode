import { randomUUID } from "node:crypto";

import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

export const INSTITUTIONAL_ROLES = [
  { code: "admin", name: "Administrador" },
  { code: "coordinator", name: "Coordinador" },
  { code: "teacher_leader", name: "Docente lider" },
  { code: "researcher", name: "Investigador" },
  { code: "student", name: "Estudiante" },
] as const;

export type RoleCode = (typeof INSTITUTIONAL_ROLES)[number]["code"];

@Entity({ name: "roles" })
export class Role {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 40, unique: true })
  code!: RoleCode;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
