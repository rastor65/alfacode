import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth/access";
import {
  assignRoleAction,
  removeRoleAction,
  updateUserStatusAction,
} from "@/features/users/actions/user-management-actions";
import {
  getManagedRoles,
  getManagedUsers,
} from "@/features/users/services/user-management-repository";

export const dynamic = "force-dynamic";

export default async function InternalUsersPage() {
  const session = await requirePermission("users.read");
  const canManage = session.user.permissions.includes("users.manage");
  const [users, roles] = await Promise.all([getManagedUsers(), getManagedRoles()]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#347f92]">
            Sistema
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10242c]">Usuarios</h1>
          <p className="mt-3 max-w-3xl text-[#5d7179]">
            Gestion de cuentas, estado y roles asignados. Los permisos efectivos
            se calculan desde RBAC y se reflejan en la sesion del usuario.
          </p>
        </div>
        <div className="rounded-lg border border-[#d5e6ea] bg-[#f7fbfc] px-4 py-3 text-sm text-[#5d7179]">
          {users.length} usuarios registrados
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-[#d5e6ea] bg-white shadow-[0_2px_8px_rgba(8,21,27,0.05)]">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-[#eef7f9] text-[#29404a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Roles</th>
              <th className="px-4 py-3 font-semibold">Permisos</th>
              <th className="px-4 py-3 font-semibold">Gestion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d5e6ea]">
            {users.map((user) => (
              <tr key={user.id} className="align-top transition hover:bg-[#f7fbfc]">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[#10242c]">
                    {user.name ?? "Sin nombre"}
                  </p>
                  <p className="mt-1 text-xs text-[#5d7179]">{user.email}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge
                    className={
                      user.status === "ACTIVE"
                        ? "border-[#278a65]/20 bg-[#278a65]/10 text-[#278a65]"
                        : "border-[#b7791f]/20 bg-[#b7791f]/10 text-[#8a5d18]"
                    }
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex max-w-sm flex-wrap gap-2">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center gap-2 rounded-md border border-[#d5e6ea] bg-white px-2 py-1 text-xs font-medium text-[#29404a]"
                        >
                          {role.name}
                          {canManage ? (
                            <form action={removeRoleAction}>
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="roleId" value={role.id} />
                              <button
                                type="submit"
                                className="text-[#c84a4a] transition hover:text-[#9f3636]"
                                aria-label={`Quitar rol ${role.name}`}
                              >
                                x
                              </button>
                            </form>
                          ) : null}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#93a5ac]">Sin roles</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-[#29404a]">
                  {user.permissionsCount}
                </td>
                <td className="px-4 py-4">
                  {canManage ? (
                    <div className="space-y-3">
                      <form action={assignRoleAction} className="flex gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="roleId"
                          className="min-h-10 rounded-md border border-[#d5e6ea] bg-white px-3 text-sm text-[#29404a] outline-none focus:border-[#469eb4]"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Asignar rol
                          </option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="min-h-10 rounded-md bg-[#347f92] px-3 text-sm font-semibold text-white transition hover:bg-[#286273]"
                        >
                          Asignar
                        </button>
                      </form>
                      <form action={updateUserStatusAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                        />
                        <button
                          type="submit"
                          className="text-sm font-medium text-[#286273] transition hover:text-[#14333d]"
                        >
                          {user.status === "ACTIVE" ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-sm text-[#93a5ac]">Solo lectura</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
