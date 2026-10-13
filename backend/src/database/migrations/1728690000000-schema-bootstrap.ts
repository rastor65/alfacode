import type { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaBootstrap1728690000000 implements MigrationInterface {
  name = "SchemaBootstrap1728690000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS schema_metadata (
          id uuid PRIMARY KEY,
          key varchar(120) NOT NULL UNIQUE,
          value text NOT NULL,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await queryRunner.query(`
        INSERT INTO schema_metadata (id, key, value)
        VALUES ('00000000-0000-4000-8000-000000000001', 'schema_bootstrap', 'initialized')
        ON CONFLICT (key) DO NOTHING
      `);

      return;
    }

    if (type === "better-sqlite3" || type === "sqlite") {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS schema_metadata (
          id text PRIMARY KEY,
          key text NOT NULL UNIQUE,
          value text NOT NULL,
          created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await queryRunner.query(`
        INSERT OR IGNORE INTO schema_metadata (id, key, value)
        VALUES ('00000000-0000-4000-8000-000000000001', 'schema_bootstrap', 'initialized')
      `);

      return;
    }

    throw new Error(`Unsupported migration database type: ${type}`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS schema_metadata");
  }
}
