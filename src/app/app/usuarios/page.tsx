import { UsersManagementPage } from "@/features/users/components/users-management-page";
import { requirePermission } from "@/lib/auth/access";
import {
  getManagedRoles,
  getManagedUsers,
} from "@/features/users/services/user-management-repository";

export const dynamic = "force-dynamic";

export default async function InternalUsersPage() {
  const session = await requirePermission("users.read");
  const canManage = session.user.permissions.includes("users.manage");
  const [users, roles] = await Promise.all([getManagedUsers(), getManagedRoles()]);

  return <UsersManagementPage canManage={canManage} roles={roles} users={users} />;
}
