"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useContext, useMemo } from "react";

import {
  type PermissionAction,
  type ResourcePermissions,
  canPerform,
  getAuthorizedMenu,
  getRoutePermissions,
} from "./permissions";
import type { AuthResource, SessionUser } from "./roles";

export interface PermissionsContextValue {
  user: SessionUser;
  currentPath: string;
  permissions: ResourcePermissions;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  can: (action: PermissionAction, targetPath?: string) => boolean;
  getPermissions: (targetPath?: string) => ResourcePermissions;
  menu: AuthResource[];
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const currentPath = usePathname() || "/";

  const menu = useMemo(() => getAuthorizedMenu(user), [user]);

  const permissions = useMemo(
    () => getRoutePermissions(user, currentPath),
    [user, currentPath],
  );

  const value = useMemo<PermissionsContextValue>(() => {
    return {
      user,
      currentPath,
      permissions,
      canRead: permissions.canRead,
      canCreate: permissions.canCreate,
      canUpdate: permissions.canUpdate,
      canDelete: permissions.canDelete,
      canExport: permissions.canExport,
      can: (action: PermissionAction, targetPath?: string) =>
        canPerform(user, targetPath || currentPath, action),
      getPermissions: (targetPath?: string) =>
        getRoutePermissions(user, targetPath || currentPath),
      menu,
    };
  }, [user, currentPath, permissions, menu]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook para consultar los permisos efectivos del usuario actual.
 * Si se omite `targetPath`, evalúa la vista/ruta actual.
 */
export function usePermissions(targetPath?: string) {
  const ctx = useContext(PermissionsContext);
  const pathname = usePathname() || "/";

  if (!ctx) {
    // Si se utiliza fuera del PermissionsProvider (ej. pruebas aisladas), retorna fallback seguro
    return {
      user: null as unknown as SessionUser,
      currentPath: targetPath || pathname,
      permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false },
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canExport: false,
      can: () => false,
      getPermissions: () => ({ canRead: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false }),
      menu: [] as AuthResource[],
    };
  }

  if (targetPath && targetPath !== ctx.currentPath) {
    const specificPermissions = ctx.getPermissions(targetPath);
    return {
      ...ctx,
      currentPath: targetPath,
      permissions: specificPermissions,
      canRead: specificPermissions.canRead,
      canCreate: specificPermissions.canCreate,
      canUpdate: specificPermissions.canUpdate,
      canDelete: specificPermissions.canDelete,
      canExport: specificPermissions.canExport,
      can: (action: PermissionAction, path?: string) => ctx.can(action, path || targetPath),
    };
  }

  return ctx;
}

/**
 * Componente declarativo que renderiza sus hijos solo si el usuario
 * tiene autorización para la acción en la ruta especificada (o actual).
 */
export function Can({
  action,
  path,
  fallback = null,
  children,
}: {
  action: PermissionAction;
  path?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can } = usePermissions(path);
  if (!can(action, path)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

/**
 * Componente declarativo para proteger una vista completa.
 * Si el usuario no tiene permiso de lectura (`canRead`), muestra una vista de advertencia.
 */
export function ProtectedView({
  path,
  fallback,
  children,
}: {
  path?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { canRead } = usePermissions(path);

  if (!canRead) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-4 text-base font-bold text-hub-text">Acceso no autorizado</h2>
        <p className="mt-1 text-xs text-hub-muted">
          Tu usuario o rol actual no cuenta con permisos suficientes para acceder a este módulo del sistema.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
