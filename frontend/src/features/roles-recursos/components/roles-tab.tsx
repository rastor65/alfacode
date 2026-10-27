"use client";

import { ListChecks, LoaderCircle, Pencil, Plus, Shield, ShieldCheck, ShieldOff, Trash2, Users } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { primaryButton, iconButton } from "@/features/documents/components/document-ui";
import { chip, neutralChip } from "@/features/tracking/components/dashboard-ui";
import { KpiCard } from "@/features/tracking/components/kpi-card";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import type { ResourcePermissions } from "@/lib/auth/permissions";

import type { RoleItem, RoleMetrics, RoleUserItem } from "../types";
import { ActiveChip, CheckField, MessageRow, rowClass, TableCard, tableHeadClass, Toolbar } from "./rbac-ui";

/** Roles base del sistema: no se pueden eliminar. */
const SYSTEM_ROLES = ["admin", "coordinator", "teacher_leader", "researcher", "student"];

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
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states for Create/Edit
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Integrantes del rol
  const [roleUsers, setRoleUsers] = useState<RoleUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const term = search.toLowerCase();
  const filteredRoles = roles.filter(
    (r) => r.name.toLowerCase().includes(term) || r.code.toLowerCase().includes(term) || (r.description && r.description.toLowerCase().includes(term)),
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
      setRoleUsers(await apiRequest<RoleUserItem[]>(`/roles/${role.id}/users`));
    } catch (err) {
      setUsersError(describeError(err));
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
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

  const handleEditSubmit = async (e: FormEvent) => {
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
    setActionError(null);
    try {
      await apiRequest(`/roles/${role.id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      setActionError(describeError(err));
    }
  };

  return (
    <>
      {metrics && (
        <dl aria-label="Resumen de roles" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total de roles" icon={Shield} value={metrics.totalRoles} hint="Roles definidos en el sistema" />
          <KpiCard label="Roles activos" icon={ShieldCheck} value={metrics.activeRoles} hint="Disponibles para asignar" />
          <KpiCard label="Roles inactivos" icon={ShieldOff} value={metrics.inactiveRoles} hint="No se pueden asignar" />
          <KpiCard label="Permisos asignados" icon={ListChecks} value={metrics.totalPermissions} hint="Entre todos los roles y recursos" />
        </dl>
      )}

      <Toolbar label="Buscar roles" value={search} onChange={setSearch} placeholder="Buscar roles por nombre o código…">
        {canCreate && (
          <button type="button" onClick={handleOpenCreate} aria-haspopup="dialog" className={primaryButton}>
            <Plus aria-hidden="true" className="size-4" />
            Nuevo rol
          </button>
        )}
      </Toolbar>

      {actionError && <Alert tone="error">{actionError}</Alert>}

      <TableCard label="Roles del sistema">
        <table className="w-full min-w-170 border-collapse text-left text-[13px]">
          <caption className="sr-only">Roles con código, descripción, estado y acciones</caption>
          <thead>
            <tr className={tableHeadClass}>
              <th scope="col" className="px-4 py-3 font-semibold">Rol / código</th>
              <th scope="col" className="px-4 py-3 font-semibold">Descripción</th>
              <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hub-border">
            {filteredRoles.length > 0 ? (
              filteredRoles.map((role) => (
                <tr key={role.id} className={rowClass}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
                        <Shield className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5">
                          <span className="font-semibold text-hub-text">{role.name}</span>
                          {SYSTEM_ROLES.includes(role.code) && <span className={neutralChip}>Base</span>}
                        </p>
                        <p className="font-mono text-[11px] text-hub-muted">{role.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-hub-muted">{role.description || "Sin descripción"}</td>
                  <td className="px-4 py-3">
                    <ActiveChip active={role.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => handleOpenUsers(role)} aria-haspopup="dialog" className={iconButton} aria-label={`Ver integrantes con el rol ${role.name}`} title="Ver integrantes asignados">
                        <Users aria-hidden="true" className="size-4" />
                      </button>
                      {canUpdate && (
                        <button type="button" onClick={() => handleOpenEdit(role)} aria-haspopup="dialog" className={iconButton} aria-label={`Editar el rol ${role.name}`} title="Editar rol">
                          <Pencil aria-hidden="true" className="size-4" />
                        </button>
                      )}
                      {canDelete && !SYSTEM_ROLES.includes(role.code) && (
                        <button type="button" onClick={() => handleDelete(role)} className={`${iconButton} hover:bg-hub-danger-bg hover:text-hub-danger-text`} aria-label={`Eliminar el rol ${role.name}`} title="Eliminar rol">
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <MessageRow colSpan={4}>{search ? <>No se encontraron roles con «{search}».</> : "Aún no hay roles."}</MessageRow>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Crear nuevo rol" description="Agrega un rol personalizado para asignar a integrantes y recursos.">
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <FormField label="Nombre del rol *" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej. Revisor externo" />
          <FormField label="Código del rol *" required value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="Ej. external_reviewer" className="[&_input]:font-mono" />
          <TextAreaField label="Descripción" rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Breve resumen de las responsabilidades del rol…" />
          <CheckField id="createIsActive" label="Rol activo (disponible para asignación)" checked={formIsActive} onChange={setFormIsActive} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" className="w-auto px-4" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" pending={submitting} pendingLabel="Creando…">
              Crear rol
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Editar rol: ${selectedRole?.name ?? ""}`} description="Modifica los datos y estado del rol.">
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <FormField label="Nombre del rol *" required value={formName} onChange={(e) => setFormName(e.target.value)} />
          <FormField label="Código (no modificable)" disabled value={formCode} readOnly className="[&_input]:font-mono" />
          <TextAreaField label="Descripción" rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          <CheckField id="editIsActive" label="Rol activo" checked={formIsActive} onChange={setFormIsActive} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" className="w-auto px-4" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" pending={submitting} pendingLabel="Guardando…">
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={usersModalOpen}
        onClose={() => setUsersModalOpen(false)}
        title={`Integrantes con el rol «${selectedRole?.name ?? ""}»`}
        description={`Usuarios asignados al rol ${selectedRole?.code ?? ""}.`}
      >
        <div className="flex flex-col gap-4">
          {loadingUsers ? (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-hub-muted" role="status">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
              Cargando integrantes…
            </p>
          ) : usersError ? (
            <Alert tone="error">{usersError}</Alert>
          ) : roleUsers.length > 0 ? (
            <ul className="max-h-72 divide-y divide-hub-border overflow-y-auto rounded-xl border border-hub-border">
              {roleUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-hub-text">{u.fullName}</p>
                    <p className="truncate font-mono text-xs text-hub-muted">{u.email}</p>
                  </div>
                  <span className={u.accountStatus === "active" ? `${chip} bg-hub-success-bg text-hub-success-text` : neutralChip}>{u.accountStatus === "active" ? "Activo" : u.accountStatus}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-hub-muted">No hay integrantes con este rol asignado actualmente.</p>
          )}
          <div className="flex justify-end">
            <Button type="button" variant="ghost" className="w-auto px-4" onClick={() => setUsersModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
