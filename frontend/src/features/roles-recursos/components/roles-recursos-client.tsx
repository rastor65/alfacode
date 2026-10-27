"use client";

import { CheckSquare, FolderKanban, Shield, Users } from "lucide-react";
import { useState } from "react";

import { neutralChip } from "@/features/tracking/components/dashboard-ui";
import { apiRequest } from "@/lib/api/client";
import type { ResourcePermissions } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/permissions-context";
import { cn } from "@/lib/utils";

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

export function RolesRecursosClient({ initialRoles, initialResources, initialMetrics, initialUsers, permissions }: RolesRecursosClientProps) {
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
    { key: "matrix" as const, label: "Matriz de permisos", icon: CheckSquare, badge: null },
    { key: "roles" as const, label: "Roles", icon: Shield, badge: roles.length },
    { key: "resources" as const, label: "Recursos", icon: FolderKanban, badge: resources.length },
    { key: "users" as const, label: "Usuarios y roles", icon: Users, badge: null },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Roles y recursos</h1>
          <span className={neutralChip}>Seguridad (RBAC)</span>
        </div>
        <p className="max-w-3xl text-sm text-hub-muted">Control de acceso dinámico basado en roles, módulos del sistema y matriz granular de permisos.</p>
      </header>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div role="tablist" aria-label="Secciones de seguridad" className="flex min-w-max items-center gap-1.5 rounded-xl bg-hub-subtle p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="rbac-panel"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex min-h-9 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                  isActive ? "bg-hub-accent font-semibold text-hub-bg shadow-sm" : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {tab.label}
                {tab.badge !== null && <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[11px]", isActive ? "bg-hub-bg/20" : "bg-hub-border text-hub-muted")}>{tab.badge}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div id="rbac-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="flex flex-col gap-6">
        {activeTab === "matrix" && <MatrixTab roles={roles} resources={resources} permissions={effectivePermissions} />}
        {activeTab === "roles" && <RolesTab roles={roles} metrics={metrics} onRefresh={refreshData} permissions={effectivePermissions} />}
        {activeTab === "resources" && <ResourcesTab resources={resources} onRefresh={refreshData} permissions={effectivePermissions} />}
        {activeTab === "users" && <UsersRolesTab roles={roles} initialUsers={initialUsers} permissions={effectivePermissions} />}
      </div>
    </div>
  );
}
