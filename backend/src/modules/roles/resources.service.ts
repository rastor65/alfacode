import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ApiError } from "../../common/api-error";
import { Resource } from "./resource.entity";
import { RoleResource } from "./role-resource.entity";
import { Role } from "./role.entity";
import type { CreateResourceDto, UpdateResourceDto } from "./dto/roles.dto";

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourcesRepo: Repository<Resource>,
    @InjectRepository(RoleResource)
    private readonly roleResourcesRepo: Repository<RoleResource>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  async findAll() {
    const all = await this.resourcesRepo.find({
      order: { order: "ASC", name: "ASC" },
      relations: { parent: true },
    });

    return all.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      urlBackend: r.urlBackend,
      urlFrontend: r.urlFrontend,
      icon: r.icon,
      parentId: r.parentId,
      parentName: r.parent?.name ?? null,
      order: r.order,
      visibleMenu: r.visibleMenu,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async findById(id: string) {
    const res = await this.resourcesRepo.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });

    if (!res) {
      throw new ApiError(404, "RESOURCE_NOT_FOUND", "Recurso no encontrado");
    }

    return res;
  }

  async create(dto: CreateResourceDto) {
    if (!dto.name?.trim()) {
      throw new ApiError(400, "INVALID_NAME", "El nombre del recurso es obligatorio");
    }
    if (!dto.urlBackend?.trim()) {
      throw new ApiError(400, "INVALID_URL", "La URL de backend es obligatoria");
    }

    const resource = this.resourcesRepo.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      urlBackend: dto.urlBackend.trim(),
      urlFrontend: dto.urlFrontend?.trim() || null,
      icon: dto.icon?.trim() || null,
      parentId: dto.parentId || null,
      order: dto.order ?? 0,
      visibleMenu: dto.visibleMenu ?? true,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.resourcesRepo.save(resource);

    // Otorgar permisos completos al rol admin automáticamente
    const adminRole = await this.rolesRepo.findOne({ where: { code: "admin" } });
    if (adminRole) {
      const adminPerm = this.roleResourcesRepo.create({
        roleId: adminRole.id,
        resourceId: saved.id,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canExport: true,
      });
      await this.roleResourcesRepo.save(adminPerm);
    }

    return saved;
  }

  async update(id: string, dto: UpdateResourceDto) {
    const resource = await this.findById(id);

    if (dto.name !== undefined) resource.name = dto.name.trim();
    if (dto.description !== undefined) resource.description = dto.description?.trim() || null;
    if (dto.urlBackend !== undefined) resource.urlBackend = dto.urlBackend.trim();
    if (dto.urlFrontend !== undefined) resource.urlFrontend = dto.urlFrontend?.trim() || null;
    if (dto.icon !== undefined) resource.icon = dto.icon?.trim() || null;
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new ApiError(400, "INVALID_PARENT", "Un recurso no puede ser padre de sí mismo");
      }
      resource.parentId = dto.parentId || null;
    }
    if (dto.order !== undefined) resource.order = dto.order;
    if (dto.visibleMenu !== undefined) resource.visibleMenu = dto.visibleMenu;
    if (dto.isActive !== undefined) resource.isActive = dto.isActive;

    return this.resourcesRepo.save(resource);
  }

  async delete(id: string) {
    const resource = await this.findById(id);
    await this.roleResourcesRepo.delete({ resourceId: id });
    await this.resourcesRepo.delete({ id });
    return { success: true, deletedId: id, name: resource.name };
  }
}
