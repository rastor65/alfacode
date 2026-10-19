"use client";

import { Check, LoaderCircle, Search, Shield, UserCheck } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { roleLabel } from "@/lib/auth/roles";
import type { ResourcePermissions } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

import type { RoleItem, UserRoleItem } from "../types";

type UsersRolesTabProps = {
  roles: RoleItem[];
  initialUsers?: UserRoleItem[];
  permissions?: ResourcePermissions;
};

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
    const activeRoleIds = roles
      .filter((r) => user.roles.includes(r.code))
      .map((r) => r.id);
    setSelectedRoleIds(activeRoleIds);
    setModalError(null);
    setModalOpen(true);
  };

  const toggleRoleId = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Toast de éxito */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500 animate-in fade-in">
          <Check size={16} />
          {successToast}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hub-muted pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar integrante por nombre o correo..."
            className="w-full rounded-xl border border-hub-border bg-hub-bg/60 pl-8 pr-3 py-2 text-xs text-hub-text placeholder:text-hub-muted focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filterByRole" className="text-xs text-hub-muted whitespace-nowrap">
            Filtrar por rol:
          </label>
          <select
            id="filterByRole"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios y Roles */}
      <div className="overflow-hidden rounded-2xl border border-hub-border bg-hub-panel shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hub-border bg-hub-hover/40 text-[11px] font-semibold uppercase tracking-wider text-hub-muted">
              <tr>
                <th className="px-4 py-3">Integrante</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Roles Asignados</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hub-border/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-hub-muted">
                    <div className="flex items-center justify-center gap-2">
                      <LoaderCircle size={18} className="animate-spin text-hub-accent" />
                      <span>Cargando integrantes...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-hub-hover/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-hub-text">{user.fullName}</p>
                        <p className="text-hub-muted font-mono text-[11px]">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={user.accountStatus === "active" ? "text-emerald-500" : undefined}>
                        {user.accountStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-md bg-hub-accent-soft px-2 py-0.5 text-[10px] font-medium text-hub-accent"
                          >
                            <Shield size={10} />
                            {roleLabel(r)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          onClick={() => handleOpenAssign(user)}
                          className="h-8 gap-1.5 text-xs text-hub-accent hover:bg-hub-accent-soft"
                        >
                          <UserCheck size={14} />
                          Gestionar Roles
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-hub-muted">
                    No se encontraron integrantes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Asignar Roles */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Gestionar Roles: ${selectedUser?.fullName}`}
        description="Selecciona los roles que tendrá asignados este usuario en el semillero."
      >
        <div className="space-y-4 py-2">
          {modalError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
              {modalError}
            </div>
          )}

          <div className="rounded-xl border border-hub-border bg-hub-hover/20 p-3 text-xs">
            <p className="font-semibold text-hub-text">{selectedUser?.fullName}</p>
            <p className="text-hub-muted font-mono">{selectedUser?.email}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-hub-text uppercase tracking-wide">
              Roles Disponibles
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {roles.map((role) => {
                const isChecked = selectedRoleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRoleId(role.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 text-left transition cursor-pointer",
                      isChecked
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-hub-border bg-hub-panel hover:bg-hub-hover/50",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md text-xs",
                        isChecked ? "bg-cyan-500 text-white" : "border border-hub-border bg-hub-bg text-transparent"
                      )}>
                        <Check size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-hub-text">{role.name}</p>
                        <p className="text-[11px] text-hub-muted font-mono">{role.code}</p>
                      </div>
                    </div>
                    {role.description && (
                      <span className="text-[10px] text-hub-muted max-w-[150px] truncate hidden sm:inline">
                        {role.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserRoles} disabled={savingRoles}>
              {savingRoles ? "Guardando..." : "Guardar Roles"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
