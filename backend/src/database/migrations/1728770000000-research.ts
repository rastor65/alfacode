import type { MigrationInterface, QueryRunner } from "typeorm";

export class Research1728770000000 implements MigrationInterface {
  name = "Research1728770000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003, DEC-025); no se declara SQL sin verificar.
      throw new Error("Research1728770000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // F3-01. `name_normalized` impide dos lineas con el mismo nombre sin depender de `lower()`,
    // que en SQLite no cubre tildes.
    await queryRunner.query(`
      CREATE TABLE research_lines (
        id varchar(36) PRIMARY KEY NOT NULL,
        name varchar(160) NOT NULL,
        name_normalized varchar(160) NOT NULL,
        description text NULL,
        objectives text NULL,
        responsible_user_id varchar(36) NULL,
        status varchar(10) NOT NULL DEFAULT 'active',
        created_by varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT uq_research_lines_name UNIQUE (name_normalized),
        CONSTRAINT chk_research_lines_status CHECK (status IN ('active', 'inactive')),
        CONSTRAINT fk_research_lines_responsible FOREIGN KEY (responsible_user_id) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT fk_research_lines_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // F3-02. La clave primaria compuesta impide asociar dos veces la misma linea.
    await queryRunner.query(`
      CREATE TABLE project_research_lines (
        project_id varchar(36) NOT NULL,
        research_line_id varchar(36) NOT NULL,
        created_by varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (project_id, research_line_id),
        CONSTRAINT fk_project_research_lines_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        CONSTRAINT fk_project_research_lines_line FOREIGN KEY (research_line_id) REFERENCES research_lines (id) ON DELETE RESTRICT,
        CONSTRAINT fk_project_research_lines_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_project_research_lines_line ON project_research_lines (research_line_id)");

    // F3-03. Una ficha por proyecto: el proyecto es la clave primaria.
    await queryRunner.query(`
      CREATE TABLE project_research_profiles (
        project_id varchar(36) PRIMARY KEY NOT NULL,
        problem text NULL,
        question text NULL,
        justification text NULL,
        methodology text NULL,
        notes text NULL,
        updated_by varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT fk_project_research_profiles_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        CONSTRAINT fk_project_research_profiles_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // F3-04. Los resultados no duplican tareas: solo referencian proyecto y participantes.
    await queryRunner.query(`
      CREATE TABLE research_results (
        id varchar(36) PRIMARY KEY NOT NULL,
        project_id varchar(36) NOT NULL,
        title varchar(200) NOT NULL,
        description text NULL,
        type varchar(20) NOT NULL DEFAULT 'finding',
        result_date varchar(10) NULL,
        "references" text NULL,
        created_by varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT chk_research_results_type CHECK (type IN ('finding', 'prototype', 'methodological', 'other')),
        CONSTRAINT fk_research_results_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        CONSTRAINT fk_research_results_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_research_results_project ON research_results (project_id)");

    await queryRunner.query(`
      CREATE TABLE research_result_participants (
        result_id varchar(36) NOT NULL,
        user_id varchar(36) NOT NULL,
        PRIMARY KEY (result_id, user_id),
        CONSTRAINT fk_research_result_participants_result FOREIGN KEY (result_id) REFERENCES research_results (id) ON DELETE CASCADE,
        CONSTRAINT fk_research_result_participants_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query("CREATE INDEX idx_research_result_participants_user ON research_result_participants (user_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS research_result_participants");
    await queryRunner.query("DROP TABLE IF EXISTS research_results");
    await queryRunner.query("DROP TABLE IF EXISTS project_research_profiles");
    await queryRunner.query("DROP TABLE IF EXISTS project_research_lines");
    await queryRunner.query("DROP TABLE IF EXISTS research_lines");
  }
}
