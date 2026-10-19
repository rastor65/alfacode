export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  description: string | null;
  urlBackend: string;
  urlFrontend: string | null;
  icon: string | null;
  order: number;
  visibleMenu: boolean;
  isActive: boolean;
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleResourcePermission {
  resourceId: string;
  resourceName: string;
  resourceDescription?: string | null;
  urlFrontend?: string | null;
  icon?: string | null;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface RolePermissionsMatrix {
  role: RoleItem;
  permissions: RoleResourcePermission[];
}

export interface RoleUserItem {
  id: string;
  fullName: string;
  email: string;
  accountStatus: string;
}

export interface UserRoleItem {
  id: string;
  fullName: string;
  email: string;
  accountStatus: string;
  roles: string[];
}

export interface RoleMetrics {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  totalPermissions: number;
}
