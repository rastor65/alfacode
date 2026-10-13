import type { MigrationInterface, QueryRunner } from "typeorm";

export class PasswordLifecycle1728730000000 implements MigrationInterface {
  name = "PasswordLifecycle1728730000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003); no se declara SQL sin verificar.
      throw new Error("PasswordLifecycle1728730000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // Contrasena temporal (DEC-016): obliga a cambiarla al ingresar y vence si no se usa.
    await queryRunner.query(
      "ALTER TABLE users ADD COLUMN must_change_password boolean NOT NULL DEFAULT (0) CHECK (must_change_password IN (0, 1))",
    );
    await queryRunner.query("ALTER TABLE users ADD COLUMN password_expires_at datetime NULL");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE users DROP COLUMN password_expires_at");
    await queryRunner.query("ALTER TABLE users DROP COLUMN must_change_password");
  }
}
