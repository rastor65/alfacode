import { randomUUID } from "node:crypto";
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { Resource } from "./resource.entity";
import { Role } from "./role.entity";

@Entity({ name: "role_resources" })
@Unique("uq_role_resource", ["roleId", "resourceId"])
export class RoleResource {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "role_id", type: "varchar", length: 36 })
  roleId!: string;

  @ManyToOne(() => Role, (role) => role.roleResources, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @Column({ name: "resource_id", type: "varchar", length: 36 })
  resourceId!: string;

  @ManyToOne(() => Resource, { onDelete: "CASCADE" })
  @JoinColumn({ name: "resource_id" })
  resource!: Resource;

  @Column({ name: "can_read", type: "boolean", default: true })
  canRead!: boolean;

  @Column({ name: "can_create", type: "boolean", default: false })
  canCreate!: boolean;

  @Column({ name: "can_update", type: "boolean", default: false })
  canUpdate!: boolean;

  @Column({ name: "can_delete", type: "boolean", default: false })
  canDelete!: boolean;

  @Column({ name: "can_export", type: "boolean", default: false })
  canExport!: boolean;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
