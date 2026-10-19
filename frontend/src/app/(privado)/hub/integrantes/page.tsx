import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MembersDirectoryClient } from "@/features/members/components/members-directory-client";
import type { MemberListItem } from "@/features/members/types";
import type { Paginated } from "@/features/membership/types";
import { serverApi } from "@/lib/api/server";
import { canPerform, getRoutePermissions } from "@/lib/auth/permissions";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Integrantes",
  robots: { index: false },
};

export default async function MembersPage() {
  const user = await requireSessionUser("/hub/integrantes");

  // Verificar permiso de lectura (VER) para la vista según RBAC
  if (!canPerform(user, "/hub/integrantes", "view")) {
    redirect("/hub");
  }

  const permissions = getRoutePermissions(user, "/hub/integrantes");
  const authority = permissions.canCreate || permissions.canUpdate;

  // Consulta paralela de estados para autoridades, o solo activos para integrantes estandar
  const [activeData, inactiveData, pendingData, rejectedData] = authority
    ? await Promise.all([
        serverApi<Paginated<MemberListItem>>("/users?status=active&pageSize=100", "/hub/integrantes").catch(() => ({
          items: [],
          total: 0,
          page: 1,
          pageSize: 100,
        })),
        serverApi<Paginated<MemberListItem>>("/users?status=inactive&pageSize=100", "/hub/integrantes").catch(() => ({
          items: [],
          total: 0,
          page: 1,
          pageSize: 100,
        })),
        serverApi<Paginated<MemberListItem>>("/users?status=pending&pageSize=100", "/hub/integrantes").catch(() => ({
          items: [],
          total: 0,
          page: 1,
          pageSize: 100,
        })),
        serverApi<Paginated<MemberListItem>>("/users?status=rejected&pageSize=100", "/hub/integrantes").catch(() => ({
          items: [],
          total: 0,
          page: 1,
          pageSize: 100,
        })),
      ])
    : [
        await serverApi<Paginated<MemberListItem>>("/users?status=active&pageSize=100", "/hub/integrantes").catch(
          () => ({
            items: [],
            total: 0,
            page: 1,
            pageSize: 100,
          }),
        ),
        { items: [], total: 0, page: 1, pageSize: 100 },
        { items: [], total: 0, page: 1, pageSize: 100 },
        { items: [], total: 0, page: 1, pageSize: 100 },
      ];

  // Consolidar lista de integrantes sin duplicados
  const combined = [...activeData.items, ...inactiveData.items, ...pendingData.items, ...rejectedData.items];
  const uniqueMembers = Array.from(new Map(combined.map((m) => [m.id, m])).values());

  const statusCounts = {
    all: uniqueMembers.length,
    active: activeData.total,
    inactive: inactiveData.total,
    pending: pendingData.total,
    rejected: rejectedData.total,
    pendingPassword: uniqueMembers.filter((m) => m.mustChangePassword).length,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <MembersDirectoryClient
        initialMembers={uniqueMembers}
        actor={{ id: user.id, roles: user.roles }}
        authority={authority}
        permissions={permissions}
        statusCounts={statusCounts}
      />
    </div>
  );
}
