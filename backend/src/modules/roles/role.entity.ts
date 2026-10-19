import { randomUUID } from "node:crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from "typeorm";

import type { RoleResource } from "./role-resource.entity";

export const INSTITUTIONAL_ROLES = [
  { code: "admin", name: "Administrador" },
  { code: "coordinator", name: "Coordinador" },
  { code: "teacher_leader", name: "Docente lider" },
  { code: "researcher", name: "Investigador" },
  { code: "student", name: "Estudiante" },
] as const;

export type InstitutionalRoleCode = (typeof INSTITUTIONAL_ROLES)[number]["code"];
export type RoleCode = InstitutionalRoleCode | string;

@Entity({ name: "roles" })
export class Role {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 40, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @OneToMany("RoleResource", (rr: RoleResource) => rr.role)
  roleResources!: RoleResource[];

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
