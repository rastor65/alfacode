import type { MigrationInterface, QueryRunner } from "typeorm";

export class MembershipRequestCv1728750000000 implements MigrationInterface {
  name = "MembershipRequestCv1728750000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      throw new Error("MembershipRequestCv1728750000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // Almacena la Hoja de Vida (RESUMEN) estructurada del estudiante aspirante en JSON
    await queryRunner.query("ALTER TABLE membership_requests ADD COLUMN cv_data text NULL");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE membership_requests DROP COLUMN cv_data");
  }
}
