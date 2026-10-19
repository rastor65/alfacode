import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

import { ApiError } from "../../common/api-error";
import { Resource } from "./resource.entity";
import { RoleResource } from "./role-resource.entity";
import { Role, type RoleCode } from "./role.entity";
import type { CreateRoleDto, ResourcePermissionDto, UpdateRoleDto } from "./dto/roles.dto";

export interface MergedAuthResource {
  id: string;
  name: string;
  description: string | null;
  urlBackend: string;
  urlFrontend: string | null;
  icon: string | null;
  order: number;
  visibleMenu: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  parentId: string | null;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Resource)
    private readonly resourcesRepo: Repository<Resource>,
    @InjectRepository(RoleResource)
    private readonly roleResourcesRepo: Repository<RoleResource>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    return this.rolesRepo.find({ order: { code: "ASC" } });
  }

  findByCode(code: RoleCode) {
    return this.rolesRepo.findOne({ where: { code } });
  }

  findById(id: string) {
    return this.rolesRepo.findOne({ where: { id } });
  }

  async findAllWithMetrics() {
    const roles = await this.rolesRepo.find({ order: { code: "ASC" } });

    // Contar usuarios y recursos por cada rol
    const userCounts: Array<{ role_id: string; count: string | number }> = await this.dataSource.query(
      "SELECT role_id, COUNT(user_id) as count FROM user_roles GROUP BY role_id",
    );
    const userCountMap = new Map<string, number>(userCounts.map((u) => [u.role_id, Number(u.count)]));

    const resourceCounts: Array<{ role_id: string; count: string | number }> = await this.dataSource.query(
      "SELECT role_id, COUNT(resource_id) as count FROM role_resources WHERE can_read = 1 GROUP BY role_id",
    );
    const resourceCountMap = new Map<string, number>(resourceCounts.map((r) => [r.role_id, Number(r.count)]));

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      userCount: userCountMap.get(role.id) ?? 0,
      resourceCount: resourceCountMap.get(role.id) ?? 0,
    }));
  }

  async createRole(dto: CreateRoleDto) {
    if (!dto.name?.trim()) {
      throw new ApiError(400, "INVALID_NAME", "El nombre del rol es obligatorio");
    }

    // Generar código único a partir del nombre
    const baseCode = dto.name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    let code = baseCode || "custom_role";
    let counter = 1;
    while (await this.rolesRepo.findOne({ where: { code } })) {
      code = `${baseCode}_${counter++}`;
    }

    const role = this.rolesRepo.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      isActive: dto.isActive ?? true,
    });

    return this.rolesRepo.save(role);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.findById(id);
    if (!role) {
      throw new ApiError(404, "ROLE_NOT_FOUND", "Rol no encontrado");
    }

    if (dto.name !== undefined) role.name = dto.name.trim();
    if (dto.description !== undefined) role.description = dto.description?.trim() || null;
    if (dto.isActive !== undefined) {
      if (role.code === "admin" && !dto.isActive) {
        throw new ApiError(400, "CANNOT_DEACTIVATE_ADMIN", "El rol de Administrador no puede ser desactivado");
      }
      role.isActive = dto.isActive;
    }

    return this.rolesRepo.save(role);
  }

  async deleteRole(id: string) {
    const role = await this.findById(id);
    if (!role) {
      throw new ApiError(404, "ROLE_NOT_FOUND", "Rol no encontrado");
    }

    if (["admin", "coordinator", "student"].includes(role.code)) {
      throw new ApiError(400, "PROTECTED_ROLE", `El rol institucional '${role.name}' no puede ser eliminado`);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query("DELETE FROM user_roles WHERE role_id = ?", [id]);
      await manager.query("DELETE FROM role_resources WHERE role_id = ?", [id]);
      await manager.delete(Role, { id });
    });

    return { success: true, deletedId: id };
  }

  /**
   * Obtiene la matriz completa de recursos y permisos para un rol dado.
   */
  async getRoleResources(roleId: string) {
    const role = await this.findById(roleId);
    if (!role) {
      throw new ApiError(404, "ROLE_NOT_FOUND", "Rol no encontrado");
    }

    const allResources = await this.resourcesRepo.find({
      order: { order: "ASC", name: "ASC" },
    });

    const roleResources = await this.roleResourcesRepo.find({
      where: { roleId },
    });

    const permMap = new Map<string, RoleResource>(roleResources.map((rr) => [rr.resourceId, rr]));

    return {
      role: {
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
      },
      resources: allResources.map((res) => {
        const perm = permMap.get(res.id);
        return {
          resourceId: res.id,
          name: res.name,
          description: res.description,
          urlBackend: res.urlBackend,
          urlFrontend: res.urlFrontend,
          icon: res.icon,
          order: res.order,
          visibleMenu: res.visibleMenu,
          isActive: res.isActive,
          canRead: perm?.canRead ?? false,
          canCreate: perm?.canCreate ?? false,
          canUpdate: perm?.canUpdate ?? false,
          canDelete: perm?.canDelete ?? false,
          canExport: perm?.canExport ?? false,
        };
      }),
    };
  }

  /**
   * Guarda o actualiza masivamente los permisos de un rol para los recursos.
   */
  async updateRoleResources(roleId: string, permissions: ResourcePermissionDto[]) {
    const role = await this.findById(roleId);
    if (!role) {
      throw new ApiError(404, "ROLE_NOT_FOUND", "Rol no encontrado");
    }

    await this.dataSource.transaction(async (manager) => {
      for (const p of permissions) {
        let existing = await manager.findOne(RoleResource, {
          where: { roleId, resourceId: p.resourceId },
        });

        if (!existing) {
          existing = manager.create(RoleResource, {
            roleId,
            resourceId: p.resourceId,
          });
        }

        existing.canRead = Boolean(p.canRead);
        existing.canCreate = Boolean(p.canCreate);
        existing.canUpdate = Boolean(p.canUpdate);
        existing.canDelete = Boolean(p.canDelete);
        existing.canExport = Boolean(p.canExport);

        await manager.save(existing);
      }
    });

    return this.getRoleResources(roleId);
  }

  /**
   * Lista usuarios asignados a un rol con su información básica.
   */
  async getRoleUsers(roleId: string) {
    const users: Array<{
      id: string;
      fullName: string;
      email: string;
      accountStatus: string;
    }> = await this.dataSource.query(
      `SELECT u.id, u.full_name as fullName, u.email_normalized as email, u.account_status as accountStatus
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       WHERE ur.role_id = ?
       ORDER BY u.full_name ASC`,
      [roleId],
    );

    return users;
  }

  /**
   * Asigna o desasigna roles a un usuario dinámicamente.
   */
  async assignUserRoles(userId: string, roleIds: string[]) {
    const userExists: Array<{ id: string }> = await this.dataSource.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (!userExists.length) {
      throw new ApiError(404, "USER_NOT_FOUND", "Usuario no encontrado");
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query("DELETE FROM user_roles WHERE user_id = ?", [userId]);

      for (const roleId of roleIds) {
        await manager.query(
          "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
          [userId, roleId],
        );
      }
    });

    return { success: true, userId, assignedRolesCount: roleIds.length };
  }

  /**
   * Calcula los recursos y el menú dinámico autorizados para el usuario activo,
   * combinando permisos de todos sus roles (exactamente como en SIEP merge_auth_resources).
   */
  async getUserAuthorizedRbac(userId: string): Promise<{
    resources: MergedAuthResource[];
    menu: MergedAuthResource[];
  }> {
    // 1. Obtener los IDs de roles activos del usuario
    const userRoleRows: Array<{ role_id: string }> = await this.dataSource.query(
      `SELECT r.id as role_id
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ? AND r.is_active = 1`,
      [userId],
    );

    const activeRoleIds = userRoleRows.map((r) => r.role_id);
    if (!activeRoleIds.length) {
      return { resources: [], menu: [] };
    }

    // 2. Obtener todos los permisos sobre recursos activos donde can_read = 1
    const rawRoleResources = await this.roleResourcesRepo.find({
      where: {
        roleId: In(activeRoleIds),
        canRead: true,
      },
      relations: { resource: true },
    });

    // 3. Combinar permisos por recurso (Unión inclusiva)
    const resourceMap = new Map<string, MergedAuthResource>();

    for (const rr of rawRoleResources) {
      const res = rr.resource;
      if (!res || !res.isActive) continue;

      const current = resourceMap.get(res.id);
      if (!current) {
        resourceMap.set(res.id, {
          id: res.id,
          name: res.name,
          description: res.description,
          urlBackend: res.urlBackend,
          urlFrontend: res.urlFrontend,
          icon: res.icon,
          order: res.order ?? 0,
          visibleMenu: res.visibleMenu,
          canRead: Boolean(rr.canRead),
          canCreate: Boolean(rr.canCreate),
          canUpdate: Boolean(rr.canUpdate),
          canDelete: Boolean(rr.canDelete),
          canExport: Boolean(rr.canExport),
          parentId: res.parentId,
        });
      } else {
        current.canRead = current.canRead || Boolean(rr.canRead);
        current.canCreate = current.canCreate || Boolean(rr.canCreate);
        current.canUpdate = current.canUpdate || Boolean(rr.canUpdate);
        current.canDelete = current.canDelete || Boolean(rr.canDelete);
        current.canExport = current.canExport || Boolean(rr.canExport);
      }
    }

    const resources = Array.from(resourceMap.values()).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
    );

    const menu = resources.filter((r) => r.visibleMenu && r.canRead);

    return { resources, menu };
  }
}
