import { Badge } from "@/components/ui/badge";
import type {
  PermissionRecord,
  RoleWithPermissions,
} from "@/features/roles/services/role-management-repository";

type RolesManagementPageProps = {
  permissionsByModule: Record<string, PermissionRecord[]>;
  roles: RoleWithPermissions[];
};

export function RolesManagementPage({
  permissionsByModule,
  roles,
}: RolesManagementPageProps) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#347f92]">
            Sistema
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10242c]">
            Roles y permisos
          </h1>
          <p className="mt-3 max-w-3xl text-[#5d7179]">
            Matriz RBAC del sistema. Los roles agrupan permisos por recurso y
            definen que vistas y acciones puede ejecutar cada usuario.
          </p>
        </div>
        <div className="rounded-lg border border-[#d5e6ea] bg-[#f7fbfc] px-4 py-3 text-sm text-[#5d7179]">
          {roles.length} roles /{" "}
          {Object.values(permissionsByModule).flat().length} permisos
        </div>
      </div>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        {roles.map((role) => {
          const groupedRolePermissions = role.permissions.reduce<
            Record<string, typeof role.permissions>
          >((groups, permission) => {
            groups[permission.module] ??= [];
            groups[permission.module].push(permission);
            return groups;
          }, {});

          return (
            <article
              key={role.id}
              className="rounded-xl border border-[#d5e6ea] bg-white p-5 shadow-[0_2px_8px_rgba(8,21,27,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#10242c]">
                    {role.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#5d7179]">
                    {role.description}
                  </p>
                </div>
                <Badge className="border-[#469eb4]/15 bg-[#469eb4]/10 text-[#286273]">
                  {role.permissions.length} permisos
                </Badge>
              </div>

              <div className="mt-5 space-y-4">
                {Object.entries(groupedRolePermissions).map(
                  ([module, permissions]) => (
                    <div key={module}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#347f92]">
                        {module}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {permissions.map((permission) => (
                          <span
                            key={permission.id}
                            className="rounded-md border border-[#d5e6ea] bg-[#f7fbfc] px-2 py-1 text-xs text-[#29404a]"
                            title={permission.description ?? permission.key}
                          >
                            {permission.key}
                          </span>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
