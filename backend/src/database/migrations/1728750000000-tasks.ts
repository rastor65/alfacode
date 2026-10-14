import type { MigrationInterface, QueryRunner } from "typeorm";

export class Tasks1728750000000 implements MigrationInterface {
  name = "Tasks1728750000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003); no se declara SQL sin verificar.
      throw new Error("Tasks1728750000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // F2-07. `sprint_id` queda sin clave foranea hasta que exista `sprints` (Fase 2C, DEC-021).
    await queryRunner.query(`
      CREATE TABLE tasks (
        id varchar(36) PRIMARY KEY NOT NULL,
        project_id varchar(36) NOT NULL,
        sprint_id varchar(36) NULL,
        title varchar(200) NOT NULL,
        description text NULL,
        assignee_id varchar(36) NULL,
        status varchar(20) NOT NULL DEFAULT 'todo',
        priority varchar(10) NOT NULL DEFAULT 'medium',
        due_date varchar(10) NULL,
        created_by varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT chk_tasks_status CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
        CONSTRAINT chk_tasks_priority CHECK (priority IN ('low', 'medium', 'high')),
        CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_tasks_project_status ON tasks (project_id, status)");
    await queryRunner.query("CREATE INDEX idx_tasks_assignee_id ON tasks (assignee_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS tasks");
  }
}
