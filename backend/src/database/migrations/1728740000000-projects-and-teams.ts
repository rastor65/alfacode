import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectsAndTeams1728740000000 implements MigrationInterface {
  name = "ProjectsAndTeams1728740000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003); no se declara SQL sin verificar.
      throw new Error("ProjectsAndTeams1728740000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // F2-01 y F2-02. Fechas de calendario como texto `YYYY-MM-DD` (plan, convenciones).
    await queryRunner.query(`
      CREATE TABLE projects (
        id varchar(36) PRIMARY KEY NOT NULL,
        name varchar(160) NOT NULL,
        description text NULL,
        type varchar(20) NOT NULL,
        methodology varchar(20) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'proposed',
        created_by varchar(36) NULL,
        start_date varchar(10) NULL,
        end_date varchar(10) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT chk_projects_type
          CHECK (type IN ('research', 'software', 'innovation', 'extension', 'internal', 'other')),
        CONSTRAINT chk_projects_methodology CHECK (methodology IN ('traditional', 'agile')),
        CONSTRAINT chk_projects_status
          CHECK (status IN ('proposed', 'planning', 'active', 'paused', 'completed', 'cancelled')),
        CONSTRAINT chk_projects_dates CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date),
        CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_projects_status ON projects (status)");

    // F2-04. Rol de proyecto independiente del rol institucional.
    await queryRunner.query(`
      CREATE TABLE project_members (
        project_id varchar(36) NOT NULL,
        user_id varchar(36) NOT NULL,
        role varchar(20) NOT NULL,
        added_by varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (project_id, user_id),
        CONSTRAINT chk_project_members_role CHECK (role IN ('leader', 'collaborator')),
        CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
        CONSTRAINT fk_project_members_added_by FOREIGN KEY (added_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_project_members_user_id ON project_members (user_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS project_members");
    await queryRunner.query("DROP TABLE IF EXISTS projects");
  }
}
