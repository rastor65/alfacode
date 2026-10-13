import type { MigrationInterface, QueryRunner } from "typeorm";

export class AuditEvents1728720000000 implements MigrationInterface {
  name = "AuditEvents1728720000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003); no se declara SQL sin verificar.
      throw new Error("AuditEvents1728720000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // actor_user_id sin clave foranea: el historial de auditoria no debe perderse ni bloquear
    // cambios futuros sobre usuarios.
    await queryRunner.query(`
      CREATE TABLE audit_events (
        id varchar(36) PRIMARY KEY NOT NULL,
        actor_user_id varchar(36) NULL,
        action varchar(60) NOT NULL,
        target_type varchar(40) NOT NULL,
        target_id varchar(36) NOT NULL,
        details text NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query("CREATE INDEX idx_audit_events_target ON audit_events (target_type, target_id)");
    await queryRunner.query("CREATE INDEX idx_audit_events_actor ON audit_events (actor_user_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS audit_events");
  }
}
