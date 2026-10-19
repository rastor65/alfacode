export class CreateRoleDto {
  name!: string;
  description?: string;
  isActive?: boolean;
}

export class UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export class ResourcePermissionDto {
  resourceId!: string;
  canRead!: boolean;
  canCreate!: boolean;
  canUpdate!: boolean;
  canDelete!: boolean;
  canExport!: boolean;
}

export class UpdateRolePermissionsDto {
  permissions!: ResourcePermissionDto[];
}

export class CreateResourceDto {
  name!: string;
  description?: string;
  urlBackend!: string;
  urlFrontend?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
  visibleMenu?: boolean;
  isActive?: boolean;
}

export class UpdateResourceDto {
  name?: string;
  description?: string;
  urlBackend?: string;
  urlFrontend?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
  visibleMenu?: boolean;
  isActive?: boolean;
}

export class AssignUserRolesDto {
  roleIds!: string[];
}
