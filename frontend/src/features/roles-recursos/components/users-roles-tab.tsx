"use client";

import { Check, LoaderCircle, Shield, UserCheck } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { chip, neutralChip } from "@/features/tracking/components/dashboard-ui";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import type { ResourcePermissions } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

import type { RoleItem, UserRoleItem } from "../types";
import { MessageRow, rowClass, TableCard, tableHeadClass, Toolbar } from "./rbac-ui";

type UsersRolesTabProps = {
  roles: RoleItem[];
  initialUsers?: UserRoleItem[];
  permissions?: ResourcePermissions;
};

const controlClass = "min-h-10 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

export function UsersRolesTab({ roles, initialUsers = [], permissions }: UsersRolesTabProps) {
  const canUpdate = permissions?.canUpdate ?? true;
  const [users, setUsers] = useState<UserRoleItem[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal Asignar Roles
  const [selectedUser, setSelectedUser] = useState<UserRoleItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ items: UserRoleItem[] }>("/users?pageSize=100&status=active");
      setUsers(response.items || []);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = (user: UserRoleItem) => {
    setSelectedUser(user);
    // Mapear los roles actuales del usuario (códigos) a los IDs correspondientes
    setSelectedRoleIds(roles.filter((r) => user.roles.includes(r.code)).map((r) => r.id));
    setModalError(null);
    setModalOpen(true);
  };

  const toggleRoleId = (roleId: string) => {
    setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUser) return;
    if (selectedRoleIds.length === 0) {
      setModalError("El integrante debe tener al menos un rol asignado.");
      return;
    }
    setSavingRoles(true);
    setModalError(null);
    try {
      await apiRequest("/roles/users/assign", {
        method: "POST",
        body: JSON.stringify({
          userId: selectedUser.id,
          roleIds: selectedRoleIds,
        }),
      });

      setSuccessToast(`Roles actualizados para ${selectedUser.fullName}.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setModalOpen(false);
      void loadUsers();
    } catch (err) {
      setModalError(describeError(err));
    } finally {
      setSavingRoles(false);
    }
  };

  const term = search.toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <>
      {successToast && <Alert tone="success">{successToast}</Alert>}

      <Toolbar label="Buscar integrantes" value={search} onChange={setSearch} placeholder="Buscar integrante por nombre o correo…">
        <label className="flex items-center gap-1.5 text-xs text-hub-muted">
          Rol
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={controlClass}>
            <option value="all">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </Toolbar>

      <TableCard label="Integrantes y sus roles">
        <table className="w-full min-w-170 border-collapse text-left text-[13px]">
          <caption className="sr-only">Integrantes activos con su estado, roles asignados y acción para gestionarlos</caption>
          <thead>
            <tr className={tableHeadClass}>
              <th scope="col" className="px-4 py-3 font-semibold">Integrante</th>
              <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-4 py-3 font-semibold">Roles asignados</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hub-border">
            {loading ? (
              <MessageRow colSpan={4}>
                <span className="flex items-center justify-center gap-2" role="status">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-hub-accent motion-reduce:animate-none" />
                  Cargando integrantes…
                </span>
              </MessageRow>
            ) : error ? (
              <MessageRow colSpan={4}>
                <span className="text-hub-danger-text">{error}</span>
              </MessageRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className={rowClass}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-hub-text">{user.fullName}</p>
                    <p className="font-mono text-[11px] text-hub-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.accountStatus === "active" ? `${chip} rounded-full bg-hub-success-bg px-2.5 py-1 text-hub-success-text` : `${neutralChip} rounded-full px-2.5 py-1`}>
                      {user.accountStatus === "active" ? "Activo" : user.accountStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((r) => (
                        <span key={r} className={`${chip} gap-1 rounded-full bg-hub-accent-soft px-2.5 text-hub-accent`}>
                          <Shield aria-hidden="true" className="size-3" />
                          {roleLabel(r)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssign(user)}
                        aria-haspopup="dialog"
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-hub-accent transition-colors hover:bg-hub-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                      >
                        <UserCheck aria-hidden="true" className="size-4" />
                        Gestionar roles<span className="sr-only"> de {user.fullName}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <MessageRow colSpan={4}>No se encontraron integrantes que coincidan con la búsqueda.</MessageRow>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Gestionar roles: ${selectedUser?.fullName ?? ""}`}
        description="Selecciona los roles que tendrá asignados este usuario en el semillero."
      >
        <div className="flex flex-col gap-4">
          {modalError && <Alert tone="error">{modalError}</Alert>}

          <div className="rounded-xl bg-hub-subtle p-3 text-sm">
            <p className="font-semibold text-hub-text">{selectedUser?.fullName}</p>
            <p className="font-mono text-xs text-hub-muted">{selectedUser?.email}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-hub-muted">Roles disponibles</p>
            <ul className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto">
              {roles.map((role) => {
                const isChecked = selectedRoleIds.includes(role.id);
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      aria-pressed={isChecked}
                      onClick={() => toggleRoleId(role.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                        isChecked ? "border-hub-accent bg-hub-accent-soft" : "border-hub-border bg-hub-panel hover:bg-hub-hover",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className={cn("flex size-6 shrink-0 items-center justify-center rounded-md border", isChecked ? "border-hub-accent bg-hub-accent text-hub-bg" : "border-hub-border text-transparent")}>
                          <Check className="size-3.5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-hub-text">{role.name}</span>
                          <span className="block font-mono text-[11px] text-hub-muted">{role.code}</span>
                        </span>
                      </span>
                      {role.description && <span className="hidden max-w-40 truncate text-xs text-hub-muted sm:inline">{role.description}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" className="w-auto px-4" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserRoles} pending={savingRoles} pendingLabel="Guardando…">
              Guardar roles
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
