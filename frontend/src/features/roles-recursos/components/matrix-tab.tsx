"use client";

import {
  Award,
  Calendar,
  Check,
  CheckSquare,
  FileText,
  FlaskConical,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  Repeat,
  Save,
  Shield,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { ResourcePermissions } from "@/lib/auth/permissions";

import type { ResourceItem, RoleItem, RolePermissionsMatrix, RoleResourcePermission } from "../types";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  dashboard: LayoutDashboard,
  folder: FolderKanban,
  "check-square": CheckSquare,
  repeat: Repeat,
  calendar: Calendar,
  "file-text": FileText,
  award: Award,
  inbox: Inbox,
  "user-plus": UserPlus,
  users: Users,
  shield: Shield,
  flask: FlaskConical,
  user: UserRound,
};

function renderResourceIcon(iconName: string | null) {
  const IconComp = (iconName && ICON_MAP[iconName.toLowerCase()]) || LayoutDashboard;
  return <IconComp size={15} />;
}

type MatrixTabProps = {
  roles: RoleItem[];
  resources: ResourceItem[];
  permissions?: ResourcePermissions;
};

export function MatrixTab({ roles, resources, permissions }: MatrixTabProps) {
  const canUpdate = permissions?.canUpdate ?? true;
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for permissions map: resourceId -> RoleResourcePermission
  const [permissionsMap, setPermissionsMap] = useState<Record<string, RoleResourcePermission>>({});

  const activeResources = resources.filter((r) => r.isActive);

  // Cargar matriz de permisos del rol seleccionado
  useEffect(() => {
    if (!selectedRoleId) return;

    let cancelled = false;
    async function loadMatrix() {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);
      try {
        const matrix = await apiRequest<RolePermissionsMatrix>(`/roles/${selectedRoleId}/resources`);
        if (cancelled) return;

        // Construir mapa con todos los recursos activos
        const activeList = resources.filter((r) => r.isActive);
        const map: Record<string, RoleResourcePermission> = {};
        for (const res of activeList) {
          const found = matrix.permissions?.find((p) => p.resourceId === res.id);
          map[res.id] = {
            resourceId: res.id,
            resourceName: res.name,
            resourceDescription: res.description,
            urlFrontend: res.urlFrontend,
            icon: res.icon,
            canRead: found ? Boolean(found.canRead) : false,
            canCreate: found ? Boolean(found.canCreate) : false,
            canUpdate: found ? Boolean(found.canUpdate) : false,
            canDelete: found ? Boolean(found.canDelete) : false,
            canExport: found ? Boolean(found.canExport) : false,
          };
        }
        setPermissionsMap(map);
      } catch (err) {
        if (!cancelled) {
          setError(describeError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMatrix();
    return () => {
      cancelled = true;
    };
  }, [selectedRoleId, resources]);

  const togglePermission = (
    resourceId: string,
    field: "canRead" | "canCreate" | "canUpdate" | "canDelete" | "canExport",
  ) => {
    setSaveSuccess(false);
    setPermissionsMap((prev) => {
      const current = prev[resourceId];
      if (!current) return prev;
      const nextVal = !current[field];
      return {
        ...prev,
        [resourceId]: {
          ...current,
          [field]: nextVal,
          // Si activa crear, editar, eliminar o exportar, debe poder ver el recurso
          canRead: field !== "canRead" && nextVal ? true : field === "canRead" ? nextVal : current.canRead,
        },
      };
    });
  };

  const handleGrantAll = () => {
    setSaveSuccess(false);
    setPermissionsMap((prev) => {
      const next: Record<string, RoleResourcePermission> = {};
      for (const [id, perm] of Object.entries(prev)) {
        next[id] = {
          ...perm,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          canExport: true,
        };
      }
      return next;
    });
  };

  const handleReadOnly = () => {
    setSaveSuccess(false);
    setPermissionsMap((prev) => {
      const next: Record<string, RoleResourcePermission> = {};
      for (const [id, perm] of Object.entries(prev)) {
        next[id] = {
          ...perm,
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canExport: false,
        };
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setSaveSuccess(false);
    setPermissionsMap((prev) => {
      const next: Record<string, RoleResourcePermission> = {};
      for (const [id, perm] of Object.entries(prev)) {
        next[id] = {
          ...perm,
          canRead: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canExport: false,
        };
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const list = Object.values(permissionsMap).map((p) => ({
        resourceId: p.resourceId,
        canRead: p.canRead,
        canCreate: p.canCreate,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
        canExport: p.canExport,
      }));

      await apiRequest(`/roles/${selectedRoleId}/resources`, {
        method: "PUT",
        body: JSON.stringify({ permissions: list }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Estadísticas del rol actual
  const permsList = Object.values(permissionsMap);
  const countCanRead = permsList.filter((p) => p.canRead).length;
  const countCanCreate = permsList.filter((p) => p.canCreate).length;
  const countCanUpdate = permsList.filter((p) => p.canUpdate).length;
  const countCanDelete = permsList.filter((p) => p.canDelete).length;
  const countCanExport = permsList.filter((p) => p.canExport).length;

  return (
    <div className="space-y-6">
      {/* Selector de Rol y Acciones Rápidas */}
      <div className="flex flex-col gap-4 rounded-2xl border border-hub-border bg-hub-panel p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="roleSelect" className="text-xs font-semibold uppercase tracking-wider text-hub-muted">
            Seleccionar Rol:
          </label>
          <select
            id="roleSelect"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs font-semibold text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>
        </div>

        {/* Acciones en lote */}
        {canUpdate && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-hub-muted mr-1 hidden sm:inline">Acciones rápidas:</span>
            <Button
              type="button"
              variant="ghost"
              onClick={handleGrantAll}
              className="h-8 text-xs text-cyan-500 hover:bg-cyan-500/10"
            >
              Conceder Todo
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleReadOnly}
              className="h-8 text-xs text-hub-text hover:bg-hub-hover"
            >
              Solo Lectura
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearAll}
              className="h-8 text-xs text-rose-500 hover:bg-rose-500/10"
            >
              Limpiar Todo
            </Button>
          </div>
        )}
      </div>

      {/* Resumen de permisos del rol */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-center">
        <div className="rounded-xl border border-hub-border bg-hub-panel p-2.5">
          <p className="text-[11px] text-hub-muted">Acceso / Ver</p>
          <p className="text-lg font-bold text-cyan-500">{countCanRead} / {activeResources.length}</p>
        </div>
        <div className="rounded-xl border border-hub-border bg-hub-panel p-2.5">
          <p className="text-[11px] text-hub-muted">Crear</p>
          <p className="text-lg font-bold text-emerald-500">{countCanCreate}</p>
        </div>
        <div className="rounded-xl border border-hub-border bg-hub-panel p-2.5">
          <p className="text-[11px] text-hub-muted">Editar</p>
          <p className="text-lg font-bold text-amber-500">{countCanUpdate}</p>
        </div>
        <div className="rounded-xl border border-hub-border bg-hub-panel p-2.5">
          <p className="text-[11px] text-hub-muted">Eliminar</p>
          <p className="text-lg font-bold text-rose-500">{countCanDelete}</p>
        </div>
        <div className="rounded-xl border border-hub-border bg-hub-panel p-2.5 col-span-2 sm:col-span-1">
          <p className="text-[11px] text-hub-muted">Exportar</p>
          <p className="text-lg font-bold text-indigo-400">{countCanExport}</p>
        </div>
      </div>

      {/* Alerta de guardado o error */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500 animate-in fade-in">
          <Check size={16} />
          ¡Matriz de permisos actualizada exitosamente para el rol &ldquo;{selectedRole?.name}&rdquo;!
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
          {error}
        </div>
      )}

      {/* Tabla Matriz de Permisos */}
      <div className="overflow-hidden rounded-2xl border border-hub-border bg-hub-panel shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hub-border bg-hub-hover/40 text-[11px] font-semibold uppercase tracking-wider text-hub-muted">
              <tr>
                <th className="px-4 py-3">Recurso / Módulo</th>
                <th className="px-3 py-3 text-center">Puede Ver</th>
                <th className="px-3 py-3 text-center">Puede Crear</th>
                <th className="px-3 py-3 text-center">Puede Editar</th>
                <th className="px-3 py-3 text-center">Puede Eliminar</th>
                <th className="px-3 py-3 text-center">Puede Exportar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hub-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-hub-muted">
                    <div className="flex items-center justify-center gap-2">
                      <LoaderCircle size={18} className="animate-spin text-hub-accent" />
                      <span>Cargando matriz de permisos...</span>
                    </div>
                  </td>
                </tr>
              ) : activeResources.length > 0 ? (
                activeResources.map((res) => {
                  const perm = permissionsMap[res.id] || {
                    canRead: false,
                    canCreate: false,
                    canUpdate: false,
                    canDelete: false,
                    canExport: false,
                  };

                  return (
                    <tr
                      key={res.id}
                      className={cn(
                        "transition hover:bg-hub-hover/30",
                        perm.canRead ? "bg-hub-hover/10" : "opacity-60",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg",
                            perm.canRead ? "bg-hub-accent-soft text-hub-accent" : "bg-hub-border/40 text-hub-muted"
                          )}>
                            {renderResourceIcon(res.icon)}
                          </div>
                          <div>
                            <p className="font-semibold text-hub-text">{res.name}</p>
                            <p className="text-[11px] text-hub-muted truncate max-w-xs">
                              {res.urlFrontend || res.urlBackend}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canRead}
                          disabled={!canUpdate || saving || loading}
                          onChange={() => togglePermission(res.id, "canRead")}
                          title={`Puede ver ${res.name}`}
                          className={cn("size-4.5 rounded border-hub-border text-cyan-600 focus:ring-cyan-500", canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-60")}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canCreate}
                          disabled={!canUpdate || saving || loading}
                          onChange={() => togglePermission(res.id, "canCreate")}
                          title={`Puede crear en ${res.name}`}
                          className={cn("size-4.5 rounded border-hub-border text-emerald-600 focus:ring-emerald-500", canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-60")}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canUpdate}
                          disabled={!canUpdate || saving || loading}
                          onChange={() => togglePermission(res.id, "canUpdate")}
                          title={`Puede editar en ${res.name}`}
                          className={cn("size-4.5 rounded border-hub-border text-amber-600 focus:ring-amber-500", canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-60")}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canDelete}
                          disabled={!canUpdate || saving || loading}
                          onChange={() => togglePermission(res.id, "canDelete")}
                          title={`Puede eliminar en ${res.name}`}
                          className={cn("size-4.5 rounded border-hub-border text-rose-600 focus:ring-rose-500", canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-60")}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canExport}
                          disabled={!canUpdate || saving || loading}
                          onChange={() => togglePermission(res.id, "canExport")}
                          title={`Puede exportar en ${res.name}`}
                          className={cn("size-4.5 rounded border-hub-border text-indigo-600 focus:ring-indigo-500", canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-60")}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-hub-muted">
                    No hay recursos activos configurados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón flotante / inferior de Guardar */}
      {canUpdate && (
        <div className="flex items-center justify-between rounded-2xl border border-hub-border bg-hub-panel p-4 shadow-sm">
          <p className="text-xs text-hub-muted">
            Los cambios se aplicarán inmediatamente a las sesiones de los integrantes con este rol.
          </p>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            {saving ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Matriz de Permisos
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
