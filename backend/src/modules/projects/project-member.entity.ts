import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { User } from "../users/user.entity";
import { Project } from "./project.entity";

/** Rol dentro de un proyecto; independiente del rol institucional (plan, seccion 1.2). */
export const PROJECT_ROLES = ["leader", "collaborator"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

@Entity({ name: "project_members" })
export class ProjectMember {
  @PrimaryColumn({ name: "project_id", type: "varchar", length: 36 })
  projectId!: string;

  @PrimaryColumn({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @ManyToOne(() => Project, (project) => project.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 20 })
  role!: ProjectRole;

  @Column({ name: "added_by", type: "varchar", length: 36, nullable: true })
  addedBy!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;
}
