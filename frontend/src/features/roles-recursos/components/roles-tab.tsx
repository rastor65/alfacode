"use client";

import { CheckCircle2, Edit2, LoaderCircle, Plus, Shield, Trash2, Users, XCircle } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import type { ResourcePermissions } from "@/lib/auth/permissions";

import type { RoleItem, RoleMetrics, RoleUserItem } from "../types";

type RolesTabProps = {
  roles: RoleItem[];
  metrics: RoleMetrics | null;
  onRefresh: () => void;
  permissions?: ResourcePermissions;
};

export function RolesTab({ roles, metrics, onRefresh, permissions }: RolesTabProps) {
  const canCreate = permissions?.canCreate ?? true;
  const canUpdate = permissions?.canUpdate ?? true;
  const canDelete = permissions?.canDelete ?? true;

  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  // Form states for Create/Edit
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Users drawer states
  const [roleUsers, setRoleUsers] = useState<RoleUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase())),
  );

  const handleOpenCreate = () => {
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormIsActive(true);
    setFormError(null);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (role: RoleItem) => {
    setSelectedRole(role);
    setFormName(role.name);
    setFormCode(role.code);
    setFormDescription(role.description || "");
    setFormIsActive(role.isActive);
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleOpenUsers = async (role: RoleItem) => {
    setSelectedRole(role);
    setUsersModalOpen(true);
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const users = await apiRequest<RoleUserItem[]>(`/roles/${role.id}/users`);
      setRoleUsers(users);
    } catch (err) {
      setUsersError(describeError(err));
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setFormError("El nombre y código son obligatorios.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiRequest("/roles", {
        method: "POST",
        body: JSON.stringify({
          name: formName.trim(),
          code: formCode.trim().toLowerCase(),
          description: formDescription.trim() || null,
          isActive: formIsActive,
        }),
      });
      setCreateModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiRequest(`/roles/${selectedRole.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          isActive: formIsActive,
        }),
      });
      setEditModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: RoleItem) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${role.name}" (${role.code})?`)) {
      return;
    }
    try {
      await apiRequest(`/roles/${role.id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      alert(describeError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-hub-border bg-hub-panel p-4 shadow-sm">
            <p className="text-xs font-medium text-hub-muted">Total Roles</p>
            <p className="mt-1 text-2xl font-bold text-hub-text">{metrics.totalRoles}</p>
          </div>
          <div className="rounded-2xl border border-hub-border bg-hub-panel p-4 shadow-sm">
            <p className="text-xs font-medium text-hub-muted">Roles Activos</p>
            <p className="mt-1 text-2xl font-bold text-emerald-500">{metrics.activeRoles}</p>
          </div>
          <div className="rounded-2xl border border-hub-border bg-hub-panel p-4 shadow-sm">
            <p className="text-xs font-medium text-hub-muted">Roles Inactivos</p>
            <p className="mt-1 text-2xl font-bold text-amber-500">{metrics.inactiveRoles}</p>
          </div>
          <div className="rounded-2xl border border-hub-border bg-hub-panel p-4 shadow-sm">
            <p className="text-xs font-medium text-hub-muted">Permisos Asignados</p>
            <p className="mt-1 text-2xl font-bold text-cyan-500">{metrics.totalPermissions}</p>
          </div>
        </div>
      )}

      {/* Barra de Búsqueda y Botón Nuevo Rol */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar roles por nombre o código..."
            className="w-full rounded-xl border border-hub-border bg-hub-bg/60 px-3 py-2 text-xs text-hub-text placeholder:text-hub-muted focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus size={16} />
            Nuevo Rol
          </Button>
        )}
      </div>

      {/* Tabla de Roles */}
      <div className="overflow-hidden rounded-2xl border border-hub-border bg-hub-panel shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hub-border bg-hub-hover/40 text-[11px] font-semibold uppercase tracking-wider text-hub-muted">
              <tr>
                <th className="px-4 py-3">Rol / Código</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hub-border/60">
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="transition hover:bg-hub-hover/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
                          <Shield size={14} />
                        </div>
                        <div>
                          <p className="font-semibold text-hub-text">{role.name}</p>
                          <p className="font-mono text-[11px] text-hub-muted">{role.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-hub-muted max-w-xs truncate">
                      {role.description || "Sin descripción"}
                    </td>
                    <td className="px-4 py-3">
                      {role.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                          <CheckCircle2 size={12} /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-500">
                          <XCircle size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => handleOpenUsers(role)}
                          title="Ver integrantes asignados"
                          className="h-8 w-8 p-0 text-hub-muted hover:text-hub-text"
                        >
                          <Users size={14} />
                        </Button>
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEdit(role)}
                            title="Editar rol"
                            className="h-8 w-8 p-0 text-hub-muted hover:text-hub-text"
                          >
                            <Edit2 size={14} />
                          </Button>
                        )}
                        {canDelete && !["admin", "coordinator", "teacher_leader", "researcher", "student"].includes(role.code) && (
                          <Button
                            variant="ghost"
                            onClick={() => handleDelete(role)}
                            title="Eliminar rol"
                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-hub-muted">
                    No se encontraron roles con &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Rol */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nuevo Rol"
        description="Agrega un rol personalizado para asignar a integrantes y recursos."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
          {formError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">Nombre del Rol *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. Revisor Externo"
              className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">Código del Rol *</label>
            <input
              type="text"
              required
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="Ej. external_reviewer"
              className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 font-mono text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">Descripción</label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Breve resumen de las responsabilidades del rol..."
              className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createIsActive"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="size-4 rounded border-hub-border text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="createIsActive" className="text-xs text-hub-text select-none cursor-pointer">
              Rol activo (disponible para asignación)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Rol"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Rol */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Editar Rol: ${selectedRole?.name}`}
        description="Modifica los datos y estado del rol."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
          {formError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">Nombre del Rol *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">Código (No modificable)</label>
            <input
              type="text"
              disabled
              value={formCode}
              className="w-full rounded-xl border border-hub-border/50 bg-hub-hover/30 px-3 py-2 font-mono text-xs text-hub-muted cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">Descripción</label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="size-4 rounded border-hub-border text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="editIsActive" className="text-xs text-hub-text select-none cursor-pointer">
              Rol activo
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Integrantes con este Rol */}
      <Modal
        open={usersModalOpen}
        onClose={() => setUsersModalOpen(false)}
        title={`Integrantes con el rol "${selectedRole?.name}"`}
        description={`Listado de usuarios asignados al rol (${selectedRole?.code}).`}
      >
        <div className="py-2">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-6 text-hub-muted text-xs gap-2">
              <LoaderCircle size={16} className="animate-spin" />
              Cargando integrantes...
            </div>
          ) : usersError ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
              {usersError}
            </div>
          ) : roleUsers.length > 0 ? (
            <ul className="divide-y divide-hub-border/60 max-h-72 overflow-y-auto rounded-xl border border-hub-border">
              {roleUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between p-3 text-xs">
                  <div>
                    <p className="font-semibold text-hub-text">{u.fullName}</p>
                    <p className="text-hub-muted">{u.email}</p>
                  </div>
                  <Badge className={u.accountStatus === "active" ? "text-emerald-500" : undefined}>
                    {u.accountStatus}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-6 text-xs text-hub-muted">
              No hay integrantes con este rol asignado actualmente.
            </p>
          )}
          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setUsersModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
