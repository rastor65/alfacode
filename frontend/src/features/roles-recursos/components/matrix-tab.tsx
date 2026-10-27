"use client";

import {
  Award,
  Calendar,
  CheckSquare,
  Download,
  Eye,
  FileText,
  FlaskConical,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  Pencil,
  Plus,
  Repeat,
  Save,
  Shield,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { panelCard } from "@/features/tracking/components/dashboard-ui";
import { KpiCard } from "@/features/tracking/components/kpi-card";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import type { ResourcePermissions } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

import type { ResourceItem, RoleItem, RolePermissionsMatrix, RoleResourcePermission } from "../types";

const ICON_MAP: Record<string, LucideIcon> = {
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

function ResourceIcon({ name }: { name: string | null }) {
  const Icon = (name && ICON_MAP[name.toLowerCase()]) || LayoutDashboard;
  return <Icon aria-hidden="true" className="size-4" />;
}

type PermissionField = "canRead" | "canCreate" | "canUpdate" | "canDelete" | "canExport";

const FIELDS: PermissionField[] = ["canRead", "canCreate", "canUpdate", "canDelete", "canExport"];
const FIELD_LABELS: Record<PermissionField, string> = {
  canRead: "Ver",
  canCreate: "Crear",
  canUpdate: "Editar",
  canDelete: "Eliminar",
  canExport: "Exportar",
};

const NO_PERMISSIONS = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false };

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

  const togglePermission = (resourceId: string, field: PermissionField) => {
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

  /** Aplica el mismo conjunto de permisos a todos los recursos activos. */
  const setAll = (values: typeof NO_PERMISSIONS) => {
    setSaveSuccess(false);
    setPermissionsMap((prev) => {
      const next: Record<string, RoleResourcePermission> = {};
      for (const [id, perm] of Object.entries(prev)) {
        next[id] = { ...perm, ...values };
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
  const count = (field: PermissionField) => permsList.filter((p) => p[field]).length;
  const busy = !canUpdate || saving || loading;
  const quickAction =
    "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

  return (
    <>
      <section aria-label="Rol a configurar" className={cn(panelCard, "flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between")}>
        <div className="flex min-w-0 flex-col gap-1.5 md:w-96">
          <label htmlFor="roleSelect" className="text-[11px] font-semibold uppercase tracking-wider text-hub-muted">
            Rol a configurar
          </label>
          <OptionSelect id="roleSelect" options={roles.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))} value={selectedRoleId} onValueChange={setSelectedRoleId} />
        </div>

        {canUpdate && (
          <div role="group" aria-label="Acciones rápidas" className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden text-xs text-hub-muted sm:inline">Acciones rápidas:</span>
            <button
              type="button"
              onClick={() => setAll({ canRead: true, canCreate: true, canUpdate: true, canDelete: true, canExport: true })}
              className={`${quickAction} bg-hub-accent-soft text-hub-accent hover:opacity-80`}
            >
              Conceder todo
            </button>
            <button
              type="button"
              onClick={() => setAll({ ...NO_PERMISSIONS, canRead: true })}
              className={`${quickAction} bg-hub-subtle text-hub-text hover:bg-hub-hover`}
            >
              Solo lectura
            </button>
            <button type="button" onClick={() => setAll(NO_PERMISSIONS)} className={`${quickAction} bg-hub-danger-bg text-hub-danger-text hover:opacity-80`}>
              Limpiar todo
            </button>
          </div>
        )}
      </section>

      <dl aria-label={`Permisos del rol ${selectedRole?.name ?? ""}`} className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Acceso / ver" icon={Eye} value={`${count("canRead")} / ${activeResources.length}`} hint="Recursos que puede abrir" />
        <KpiCard label="Crear" icon={Plus} value={count("canCreate")} hint="Recursos donde puede crear" />
        <KpiCard label="Editar" icon={Pencil} value={count("canUpdate")} hint="Recursos donde puede editar" />
        <KpiCard label="Eliminar" icon={Trash2} value={count("canDelete")} hint="Recursos donde puede eliminar" />
        <KpiCard label="Exportar" icon={Download} value={count("canExport")} hint="Recursos que puede exportar" />
      </dl>

      {saveSuccess && <Alert tone="success">Matriz de permisos actualizada para el rol «{selectedRole?.name}».</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <section aria-label="Matriz de permisos" className={cn(panelCard, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 border-collapse text-left text-[13px]">
            <caption className="sr-only">Permisos del rol seleccionado sobre cada recurso activo</caption>
            <thead>
              <tr className="bg-hub-subtle text-[11px] uppercase tracking-wider text-hub-muted">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Recurso / módulo
                </th>
                {FIELDS.map((field) => (
                  <th key={field} scope="col" className="px-3 py-3 text-center font-semibold">
                    {FIELD_LABELS[field]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hub-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-hub-muted">
                    <span className="flex items-center justify-center gap-2" role="status">
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-hub-accent motion-reduce:animate-none" />
                      Cargando matriz de permisos…
                    </span>
                  </td>
                </tr>
              ) : activeResources.length > 0 ? (
                activeResources.map((res) => {
                  const perm = permissionsMap[res.id] || NO_PERMISSIONS;

                  return (
                    <tr key={res.id} className="transition-colors hover:bg-hub-hover/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", perm.canRead ? "bg-hub-accent-soft text-hub-accent" : "bg-hub-badge-bg text-hub-badge-text")}
                          >
                            <ResourceIcon name={res.icon} />
                          </span>
                          <div className="min-w-0">
                            <p className={cn("font-semibold", perm.canRead ? "text-hub-text" : "text-hub-muted")}>{res.name}</p>
                            <p className="max-w-xs truncate font-mono text-[11px] text-hub-muted">{res.urlFrontend || res.urlBackend}</p>
                          </div>
                        </div>
                      </td>
                      {FIELDS.map((field) => (
                        <td key={field} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm[field]}
                            disabled={busy}
                            onChange={() => togglePermission(res.id, field)}
                            aria-label={`${FIELD_LABELS[field]} en ${res.name}`}
                            className={cn("size-4.5 accent-(--hub-accent)", canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-60")}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-hub-muted">
                    No hay recursos activos configurados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {canUpdate && (
        <div className={cn(panelCard, "flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center")}>
          <p className="text-sm text-hub-muted">Los cambios se aplican de inmediato a las sesiones de los integrantes con este rol.</p>
          <Button onClick={handleSave} disabled={saving || loading} className="w-auto gap-2 px-5">
            {saving ? (
              <>
                <LoaderCircle aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" />
                Guardando…
              </>
            ) : (
              <>
                <Save aria-hidden="true" size={16} />
                Guardar matriz de permisos
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
