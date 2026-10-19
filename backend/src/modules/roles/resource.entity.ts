import { randomUUID } from "node:crypto";
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "resources" })
export class Resource {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "url_backend", type: "varchar", length: 255 })
  urlBackend!: string;

  @Column({ name: "url_frontend", type: "varchar", length: 255, nullable: true })
  urlFrontend!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  icon!: string | null;

  @Column({ name: "parent_id", type: "varchar", length: 36, nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Resource, (resource) => resource.children, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "parent_id" })
  parent!: Resource | null;

  @OneToMany(() => Resource, (resource) => resource.parent)
  children!: Resource[];

  @Column({ name: "order_num", type: "smallint", default: 0 })
  order!: number;

  @Column({ name: "visible_menu", type: "boolean", default: true })
  visibleMenu!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
