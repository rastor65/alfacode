import { RolesManagementPage } from "@/features/roles/components/roles-management-page";
import { requirePermission } from "@/lib/auth/access";
import {
  getPermissionsGroupedByModule,
  getRolesWithPermissions,
} from "@/features/roles/services/role-management-repository";

export const dynamic = "force-dynamic";

export default async function InternalRolesPage() {
  await requirePermission("roles.read");
  const [roles, permissionsByModule] = await Promise.all([
    getRolesWithPermissions(),
    getPermissionsGroupedByModule(),
  ]);

  return (
    <RolesManagementPage
      permissionsByModule={permissionsByModule}
      roles={roles}
    />
  );
}
