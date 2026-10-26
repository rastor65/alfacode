import { randomUUID } from "node:crypto";
import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Agrega el recurso de Líneas de Investigación (res-investigacion-013) al catálogo RBAC
 * y asocia los permisos correspondientes a todos los roles activos.
 */
export class ResearchLinesResource1728840000000 implements MigrationInterface {
  name = "ResearchLinesResource1728840000000";

  async up(q: QueryRunner): Promise<void> {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) {
      throw new Error("ResearchLinesResource: PostgreSQL pendiente (DEC-003)");
    }

    // 1. Insertar recurso si no existe
    const existing = await q.query("SELECT id FROM resources WHERE id = 'res-investigacion-013'");
    if (existing.length === 0) {
      await q.query(
        `INSERT INTO resources (id, name, description, url_backend, url_frontend, icon, order_num, visible_menu, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          "res-investigacion-013",
          "Investigación",
          "Líneas de investigación y catálogo temático del semillero",
          "/api/v1/research-lines",
          "/hub/investigacion",
          "flask",
          5,
          1,
        ],
      );
    }

    // 2. Vincular roles con sus permisos correspondientes
    const roles: Array<{ id: string; code: string }> = await q.query("SELECT id, code FROM roles");

    for (const role of roles) {
      let canRead = 1;
      let canCreate = 0;
      let canUpdate = 0;
      let canDelete = 0;
      let canExport = 0;

      if (role.code === "admin" || role.code === "coordinator") {
        canCreate = 1;
        canUpdate = 1;
        canDelete = 1;
        canExport = 1;
      } else if (role.code === "teacher_leader" || role.code === "researcher") {
        canExport = 1;
      }

      const existingBinding = await q.query(
        "SELECT id FROM role_resources WHERE role_id = ? AND resource_id = 'res-investigacion-013'",
        [role.id],
      );

      if (existingBinding.length === 0) {
        await q.query(
          `INSERT INTO role_resources (id, role_id, resource_id, can_read, can_create, can_update, can_delete, can_export)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), role.id, "res-investigacion-013", canRead, canCreate, canUpdate, canDelete, canExport],
        );
      }
    }
  }

  async down(q: QueryRunner): Promise<void> {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) {
      throw new Error("ResearchLinesResource: PostgreSQL pendiente (DEC-003)");
    }
    await q.query("DELETE FROM role_resources WHERE resource_id = 'res-investigacion-013'");
    await q.query("DELETE FROM resources WHERE id = 'res-investigacion-013'");
  }
}
