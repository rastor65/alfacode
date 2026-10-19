"use client";

import { CheckSquare, FolderKanban, Shield, Users } from "lucide-react";
import { useState } from "react";

import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import type { ResourcePermissions } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/permissions-context";

import type { ResourceItem, RoleItem, RoleMetrics, UserRoleItem } from "../types";
import { MatrixTab } from "./matrix-tab";
import { ResourcesTab } from "./resources-tab";
import { RolesTab } from "./roles-tab";
import { UsersRolesTab } from "./users-roles-tab";

type TabKey = "roles" | "resources" | "matrix" | "users";

type RolesRecursosClientProps = {
  initialRoles: RoleItem[];
  initialResources: ResourceItem[];
  initialMetrics: RoleMetrics | null;
  initialUsers: UserRoleItem[];
  permissions?: ResourcePermissions;
};

export function RolesRecursosClient({
  initialRoles,
  initialResources,
  initialMetrics,
  initialUsers,
  permissions,
}: RolesRecursosClientProps) {
  const contextPermissions = usePermissions("/hub/roles-recursos");
  const effectivePermissions = permissions ?? contextPermissions.permissions;
  const [activeTab, setActiveTab] = useState<TabKey>("matrix");
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [metrics, setMetrics] = useState<RoleMetrics | null>(initialMetrics);

  const refreshData = async () => {
    try {
      const [newRoles, newResources, newMetrics] = await Promise.all([
        apiRequest<RoleItem[]>("/roles"),
        apiRequest<ResourceItem[]>("/resources"),
        apiRequest<RoleMetrics>("/roles/metrics"),
      ]);
      setRoles(newRoles);
      setResources(newResources);
      setMetrics(newMetrics);
    } catch {
      // Ignore refresh errors
    }
  };

  const tabs = [
    { key: "matrix" as const, label: "Matriz de Permisos", icon: CheckSquare, badge: null },
    { key: "roles" as const, label: "Roles", icon: Shield, badge: roles.length },
    { key: "resources" as const, label: "Recursos", icon: FolderKanban, badge: resources.length },
    { key: "users" as const, label: "Usuarios y Roles", icon: Users, badge: null },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado y Selector de Pestañas */}
      <div className="border-b border-hub-border pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-hub-text sm:text-2xl">
              Roles y Recursos (RBAC)
            </h1>
            <p className="mt-1 text-xs text-hub-muted sm:text-sm">
              Control de acceso dinámico basado en roles, módulos del sistema y matriz granular de permisos.
            </p>
          </div>
        </div>

        {/* Barra de Pestañas */}
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-hub-accent text-white shadow-sm"
                    : "bg-hub-panel text-hub-muted hover:bg-hub-hover hover:text-hub-text border border-hub-border/60",
                )}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={cn(
                      "ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                      isActive ? "bg-white/20 text-white" : "bg-hub-hover text-hub-muted",
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === "matrix" && (
        <MatrixTab roles={roles} resources={resources} permissions={effectivePermissions} />
      )}
      {activeTab === "roles" && (
        <RolesTab roles={roles} metrics={metrics} onRefresh={refreshData} permissions={effectivePermissions} />
      )}
      {activeTab === "resources" && (
        <ResourcesTab resources={resources} onRefresh={refreshData} permissions={effectivePermissions} />
      )}
      {activeTab === "users" && (
        <UsersRolesTab roles={roles} initialUsers={initialUsers} permissions={effectivePermissions} />
      )}
    </div>
  );
}
