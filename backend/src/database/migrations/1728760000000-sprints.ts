import type { MigrationInterface, QueryRunner } from "typeorm";

const TASK_COLUMNS =
  "id, project_id, sprint_id, title, description, assignee_id, status, priority, due_date, created_by, created_at, updated_at";

/** Definicion de `tasks`; con `withSprintFk` agrega la clave foranea compuesta hacia `sprints`. */
function tasksTable(name: string, withSprintFk: boolean) {
  return `
    CREATE TABLE ${name} (
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
      CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL${
        withSprintFk
          ? `,
      -- F2-08: el sprint de una tarea es siempre de su mismo proyecto (clave compuesta).
      CONSTRAINT fk_tasks_sprint FOREIGN KEY (sprint_id, project_id) REFERENCES sprints (id, project_id)`
          : ""
      }
    )
  `;
}

async function rebuildTasks(queryRunner: QueryRunner, withSprintFk: boolean) {
  // SQLite no agrega claves foraneas con ALTER TABLE: se reconstruye la tabla conservando los datos.
  await queryRunner.query(tasksTable("tasks_rebuild", withSprintFk));
  await queryRunner.query(`INSERT INTO tasks_rebuild (${TASK_COLUMNS}) SELECT ${TASK_COLUMNS} FROM tasks`);
  await queryRunner.query("DROP TABLE tasks");
  await queryRunner.query("ALTER TABLE tasks_rebuild RENAME TO tasks");
  await queryRunner.query("CREATE INDEX idx_tasks_project_status ON tasks (project_id, status)");
  await queryRunner.query("CREATE INDEX idx_tasks_assignee_id ON tasks (assignee_id)");

  if (withSprintFk) {
    await queryRunner.query("CREATE INDEX idx_tasks_sprint_id ON tasks (sprint_id)");
  }
}

export class Sprints1728760000000 implements MigrationInterface {
  name = "Sprints1728760000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003); no se declara SQL sin verificar.
      throw new Error("Sprints1728760000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // F2-13. `uq_sprints_id_project` permite la clave compuesta desde `tasks`.
    await queryRunner.query(`
      CREATE TABLE sprints (
        id varchar(36) PRIMARY KEY NOT NULL,
        project_id varchar(36) NOT NULL,
        name varchar(120) NOT NULL,
        goal text NULL,
        start_date varchar(10) NOT NULL,
        end_date varchar(10) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'planned',
        created_by varchar(36) NULL,
        started_at datetime NULL,
        finished_at datetime NULL,
        cancel_reason varchar(500) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT uq_sprints_id_project UNIQUE (id, project_id),
        CONSTRAINT chk_sprints_status CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
        CONSTRAINT chk_sprints_dates CHECK (end_date >= start_date),
        CONSTRAINT fk_sprints_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        CONSTRAINT fk_sprints_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_sprints_project_id ON sprints (project_id)");
    // F2-14: un solo sprint activo por proyecto, garantizado tambien por la base de datos.
    await queryRunner.query("CREATE UNIQUE INDEX uq_sprints_one_active ON sprints (project_id) WHERE status = 'active'");

    await rebuildTasks(queryRunner, true);

    // F2-17: registro inmutable del estado de cada tarea al cerrar (o cancelar) el sprint.
    await queryRunner.query(`
      CREATE TABLE sprint_closure_items (
        sprint_id varchar(36) NOT NULL,
        task_id varchar(36) NOT NULL,
        status_at_close varchar(20) NOT NULL,
        closed_at datetime NOT NULL,
        PRIMARY KEY (sprint_id, task_id),
        CONSTRAINT chk_sprint_closure_items_status CHECK (status_at_close IN ('todo', 'in_progress', 'in_review', 'done')),
        CONSTRAINT fk_sprint_closure_items_sprint FOREIGN KEY (sprint_id) REFERENCES sprints (id) ON DELETE CASCADE,
        CONSTRAINT fk_sprint_closure_items_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS sprint_closure_items");
    await queryRunner.query("UPDATE tasks SET sprint_id = NULL");
    await rebuildTasks(queryRunner, false);
    await queryRunner.query("DROP TABLE IF EXISTS sprints");
  }
}
