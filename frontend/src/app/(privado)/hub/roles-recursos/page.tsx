import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RolesRecursosClient } from "@/features/roles-recursos/components/roles-recursos-client";
import type { ResourceItem, RoleItem, RoleMetrics, UserRoleItem } from "@/features/roles-recursos/types";
import { serverApi } from "@/lib/api/server";
import { canPerform, getRoutePermissions } from "@/lib/auth/permissions";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Roles y Recursos — AlfaCode HUB",
  description: "Administración de seguridad, control de acceso basado en roles (RBAC) y matriz de permisos.",
};

export default async function RolesRecursosPage() {
  const currentPath = "/hub/roles-recursos";
  const user = await requireSessionUser(currentPath);

  // Autorización dinámica RBAC: requiere permiso de lectura (VER) para la vista
  if (!canPerform(user, currentPath, "view")) {
    redirect("/hub");
  }

  const permissions = getRoutePermissions(user, currentPath);

  let roles: RoleItem[] = [];
  let resources: ResourceItem[] = [];
  let metrics: RoleMetrics | null = null;
  let users: UserRoleItem[] = [];

  try {
    const [rolesRes, resourcesRes, metricsRes, usersRes] = await Promise.all([
      serverApi<RoleItem[]>("/roles", currentPath),
      serverApi<ResourceItem[]>("/resources", currentPath),
      serverApi<RoleMetrics>("/roles/metrics", currentPath),
      serverApi<{ items: UserRoleItem[] }>("/users?pageSize=100&status=active", currentPath),
    ]);
    roles = rolesRes;
    resources = resourcesRes;
    metrics = metricsRes;
    users = usersRes.items || [];
  } catch {
    // Si falla la precarga en servidor, el cliente cargará por su cuenta vía apiRequest
  }

  return (
    <div className="mx-auto max-w-6xl">
      <RolesRecursosClient
        initialRoles={roles}
        initialResources={resources}
        initialMetrics={metrics}
        initialUsers={users}
        permissions={permissions}
      />
    </div>
  );
}
