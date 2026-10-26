import { randomUUID } from "node:crypto";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class RbacResources1728840000000 implements MigrationInterface {
  name = "RbacResources1728840000000";

  async up(q: QueryRunner): Promise<void> {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) {
      throw new Error("RbacResources: PostgreSQL pendiente (DEC-003)");
    }

    // 1. Ampliar tabla roles
    await q.query("ALTER TABLE roles ADD COLUMN description varchar(255) NULL");
    await q.query("ALTER TABLE roles ADD COLUMN is_active boolean NOT NULL DEFAULT 1");

    // Actualizar descripciones de roles base
    await q.query("UPDATE roles SET description = 'Acceso total y administración de seguridad y recursos' WHERE code = 'admin'");
    await q.query("UPDATE roles SET description = 'Coordinación académica, solicitudes e integrantes' WHERE code = 'coordinator'");
    await q.query("UPDATE roles SET description = 'Liderazgo de proyectos de investigación y semilleros' WHERE code = 'teacher_leader'");
    await q.query("UPDATE roles SET description = 'Investigador activo en proyectos y producción académica' WHERE code = 'researcher'");
    await q.query("UPDATE roles SET description = 'Estudiante vinculado al semillero y actividades' WHERE code = 'student'");

    // 2. Crear tabla resources
    await q.query(`
      CREATE TABLE resources (
        id varchar(36) PRIMARY KEY NOT NULL,
        name varchar(120) NOT NULL,
        description text NULL,
        url_backend varchar(255) NOT NULL,
        url_frontend varchar(255) NULL,
        icon varchar(180) NULL,
        parent_id varchar(36) NULL REFERENCES resources(id) ON DELETE SET NULL,
        order_num smallint NOT NULL DEFAULT 0,
        visible_menu boolean NOT NULL DEFAULT 1,
        is_active boolean NOT NULL DEFAULT 1,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await q.query("CREATE INDEX idx_resources_parent_id ON resources(parent_id)");
    await q.query("CREATE INDEX idx_resources_order ON resources(order_num)");

    // 3. Crear tabla role_resources
    await q.query(`
      CREATE TABLE role_resources (
        id varchar(36) PRIMARY KEY NOT NULL,
        role_id varchar(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        resource_id varchar(36) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        can_read boolean NOT NULL DEFAULT 1,
        can_create boolean NOT NULL DEFAULT 0,
        can_update boolean NOT NULL DEFAULT 0,
        can_delete boolean NOT NULL DEFAULT 0,
        can_export boolean NOT NULL DEFAULT 0,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT uq_role_resource UNIQUE (role_id, resource_id)
      )
    `);
    await q.query("CREATE INDEX idx_role_resources_role_id ON role_resources(role_id)");
    await q.query("CREATE INDEX idx_role_resources_resource_id ON role_resources(resource_id)");

    // 4. Sembrar recursos del HUB
    const resources = [
      { id: "res-panel-001", name: "Panel", desc: "Vista general y métricas de cuenta", backend: "/api/v1/auth/me", frontend: "/hub", icon: "dashboard", order: 1, menu: 1 },
      { id: "res-proyectos-002", name: "Proyectos", desc: "Gestión de proyectos tradicionales y ágiles", backend: "/api/v1/projects", frontend: "/hub/proyectos", icon: "folder", order: 2, menu: 1 },
      { id: "res-tareas-003", name: "Tareas", desc: "Tablero de tareas y seguimiento", backend: "/api/v1/tasks", frontend: "/hub/tareas", icon: "check-square", order: 3, menu: 1 },
      { id: "res-sprints-004", name: "Sprints", desc: "Planificación y ciclos ágiles de trabajo", backend: "/api/v1/sprints", frontend: "/hub/sprints", icon: "repeat", order: 4, menu: 1 },
      { id: "res-actividades-005", name: "Actividades", desc: "Eventos, talleres y cronograma institucional", backend: "/api/v1/events", frontend: "/hub/actividades", icon: "calendar", order: 5, menu: 1 },
      { id: "res-documentos-006", name: "Documentos", desc: "Repositorio institucional y archivos", backend: "/api/v1/documents", frontend: "/hub/documentos", icon: "file-text", order: 6, menu: 1 },
      { id: "res-produccion-007", name: "Producción", desc: "Productos académicos, resultados y reconocimientos", backend: "/api/v1/academic", frontend: "/hub/produccion", icon: "award", order: 7, menu: 1 },
      { id: "res-tramites-008", name: "Trámites", desc: "Solicitudes administrativas y desvinculaciones", backend: "/api/v1/administrative-requests", frontend: "/hub/tramites", icon: "inbox", order: 8, menu: 1 },
      { id: "res-solicitudes-009", name: "Solicitudes", desc: "Gestión de postulaciones y solicitudes de ingreso", backend: "/api/v1/membership/requests", frontend: "/hub/solicitudes", icon: "user-plus", order: 9, menu: 1 },
      { id: "res-integrantes-010", name: "Integrantes", desc: "Directorio de integrantes y cuentas del semillero", backend: "/api/v1/users", frontend: "/hub/integrantes", icon: "users", order: 10, menu: 1 },
      { id: "res-roles-011", name: "Roles y Recursos", desc: "Administración dinámica de roles, recursos y matriz RBAC", backend: "/api/v1/roles", frontend: "/hub/roles-recursos", icon: "shield", order: 11, menu: 1 },
      { id: "res-perfil-012", name: "Mi perfil", desc: "Perfil propio y personalización de cuenta", backend: "/api/v1/users/profile", frontend: "/hub/perfil", icon: "user-round", order: 12, menu: 0 },
    ];

    for (const res of resources) {
      await q.query(
        `INSERT INTO resources (id, name, description, url_backend, url_frontend, icon, order_num, visible_menu, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [res.id, res.name, res.desc, res.backend, res.frontend, res.icon, res.order, res.menu],
      );
    }

    // 5. Vincular roles existentes con permisos
    const roles: Array<{ id: string; code: string }> = await q.query("SELECT id, code FROM roles");

    for (const role of roles) {
      for (const res of resources) {
        let canRead = 0;
        let canCreate = 0;
        let canUpdate = 0;
        let canDelete = 0;
        let canExport = 0;

        if (role.code === "admin") {
          canRead = 1;
          canCreate = 1;
          canUpdate = 1;
          canDelete = 1;
          canExport = 1;
        } else if (role.code === "coordinator") {
          if (["res-roles-011"].includes(res.id)) {
            // Coordinator solo lectura en roles y recursos
            canRead = 1;
          } else {
            canRead = 1;
            canCreate = 1;
            canUpdate = 1;
            canDelete = 1;
            canExport = 1;
          }
        } else if (role.code === "teacher_leader") {
          if (!["res-solicitudes-009", "res-roles-011"].includes(res.id)) {
            canRead = 1;
            canCreate = 1;
            canUpdate = 1;
            canExport = 1;
            if (["res-proyectos-002", "res-tareas-003", "res-actividades-005", "res-documentos-006"].includes(res.id)) {
              canDelete = 1;
            }
          }
        } else if (role.code === "researcher") {
          if (!["res-solicitudes-009", "res-roles-011", "res-integrantes-010"].includes(res.id)) {
            canRead = 1;
            canCreate = 1;
            canUpdate = 1;
            canExport = 1;
          }
        } else if (role.code === "student") {
          if (["res-panel-001", "res-proyectos-002", "res-tareas-003", "res-actividades-005", "res-documentos-006", "res-produccion-007", "res-tramites-008", "res-perfil-012"].includes(res.id)) {
            canRead = 1;
            if (["res-tareas-003", "res-tramites-008"].includes(res.id)) {
              canCreate = 1;
              canUpdate = 1;
            }
          }
        }

        if (canRead || canCreate || canUpdate || canDelete || canExport) {
          await q.query(
            `INSERT INTO role_resources (id, role_id, resource_id, can_read, can_create, can_update, can_delete, can_export)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [randomUUID(), role.id, res.id, canRead, canCreate, canUpdate, canDelete, canExport],
          );
        }
      }
    }
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query("DROP TABLE IF EXISTS role_resources");
    await q.query("DROP TABLE IF EXISTS resources");
  }
}
