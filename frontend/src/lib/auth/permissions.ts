import type { AuthResource, SessionUser } from "./roles";

export type PermissionAction =
  | "view"
  | "read"
  | "create"
  | "edit"
  | "update"
  | "delete"
  | "export"
  | "ver"
  | "crear"
  | "editar"
  | "eliminar"
  | "exportar";

export interface ResourcePermissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
}

const ACTION_MAP: Record<string, keyof ResourcePermissions> = {
  view: "canRead",
  read: "canRead",
  ver: "canRead",
  create: "canCreate",
  crear: "canCreate",
  edit: "canUpdate",
  update: "canUpdate",
  editar: "canUpdate",
  delete: "canDelete",
  eliminar: "canDelete",
  export: "canExport",
  exportar: "canExport",
};

/** Normaliza la ruta eliminando barras sobrantes y parámetros de consulta. */
export function normalizeRoute(url: string | null | undefined): string {
  if (!url) return "/";
  const cleaned = url.split("?")[0].split("#")[0].trim();
  const prefixed = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return prefixed.replace(/\/+$/, "") || "/";
}

/**
 * Busca el recurso que mejor coincide con la ruta actual (frontend o backend).
 * Da prioridad a coincidencias exactas y luego a prefijos jerárquicos.
 */
export function findResourceByPath(
  resources: AuthResource[] | undefined,
  targetUrl: string,
): AuthResource | undefined {
  if (!resources || !resources.length) return undefined;

  const target = normalizeRoute(targetUrl);

  // 1. Coincidencia exacta por URL de frontend
  const exactFrontend = resources.find((r) => r.urlFrontend && normalizeRoute(r.urlFrontend) === target);
  if (exactFrontend) return exactFrontend;

  // 2. Coincidencia exacta por URL de backend
  const exactBackend = resources.find((r) => r.urlBackend && normalizeRoute(r.urlBackend) === target);
  if (exactBackend) return exactBackend;

  // 3. Coincidencia por prefijo (ej. /hub/proyectos/123 -> /hub/proyectos)
  const prefixMatch = resources
    .filter((r) => {
      const url = r.urlFrontend ? normalizeRoute(r.urlFrontend) : null;
      return url && url !== "/" && url !== "/hub" && target.startsWith(`${url}/`);
    })
    .sort((a, b) => (b.urlFrontend?.length ?? 0) - (a.urlFrontend?.length ?? 0))[0];

  if (prefixMatch) return prefixMatch;

  // 4. Si la ruta es exactamente /hub
  if (target === "/hub") {
    return resources.find((r) => r.urlFrontend && normalizeRoute(r.urlFrontend) === "/hub");
  }

  return undefined;
}

/**
 * Obtiene los permisos efectivos (VER, CREAR, EDITAR, ELIMINAR, EXPORTAR)
 * del usuario para una vista o ruta específica.
 */
export function getRoutePermissions(user: SessionUser | null | undefined, pathname: string): ResourcePermissions {
  if (!user) {
    return { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false };
  }

  // Los administradores tienen acceso total por defecto si no hay restricción
  const isAdmin = user.roles.includes("admin");

  // Si no se han cargado recursos de RBAC (fallback por compatibilidad),
  // permitir lectura según el rol o restringir a autoridades
  const hasRbacData = (user.resources && user.resources.length > 0) || (user.menu && user.menu.length > 0);
  if (!hasRbacData) {
    const isAuthorityRole = user.roles.includes("admin") || user.roles.includes("coordinator");
    const isRestrictedView = pathname.startsWith("/hub/roles-recursos") || pathname.startsWith("/hub/solicitudes");
    const canRead = !isRestrictedView || isAuthorityRole;
    return {
      canRead,
      canCreate: isAuthorityRole,
      canUpdate: isAuthorityRole,
      canDelete: isAdmin,
      canExport: isAuthorityRole,
    };
  }

  // Buscar recurso correspondiente en los recursos del usuario
  const resource = findResourceByPath(user.resources, pathname);

  if (!resource) {
    // Si no está registrado en RBAC, el admin puede operar; los demás no tienen acceso
    return {
      canRead: isAdmin,
      canCreate: isAdmin,
      canUpdate: isAdmin,
      canDelete: isAdmin,
      canExport: isAdmin,
    };
  }

  return {
    canRead: isAdmin || Boolean(resource.canRead),
    canCreate: isAdmin || Boolean(resource.canCreate),
    canUpdate: isAdmin || Boolean(resource.canUpdate),
    canDelete: isAdmin || Boolean(resource.canDelete),
    canExport: isAdmin || Boolean(resource.canExport),
  };
}

/**
 * Verifica si el usuario puede realizar una acción puntual en la ruta especificada.
 */
export function canPerform(
  user: SessionUser | null | undefined,
  pathname: string,
  action: PermissionAction,
): boolean {
  const permissions = getRoutePermissions(user, pathname);
  const key = ACTION_MAP[action.toLowerCase()] ?? "canRead";
  return Boolean(permissions[key]);
}

/**
 * Obtiene la lista ordenada de recursos que deben mostrarse en el menú para este usuario.
 * Solo incluye recursos visibles en el menú (`visibleMenu !== false`) y donde el usuario tenga permiso de lectura (`canRead`).
 */
export function getAuthorizedMenu(user: SessionUser | null | undefined): AuthResource[] {
  if (!user) return [];

  const source = user.menu && user.menu.length > 0 ? user.menu : user.resources;
  if (!source || !source.length) return [];

  const isAdmin = user.roles.includes("admin");

  // Deduplicar por id
  const seen = new Set<string>();
  const filtered: AuthResource[] = [];

  for (const res of source) {
    if (res.visibleMenu === false) continue;
    if (!isAdmin && !res.canRead) continue;
    if (seen.has(res.id)) continue;
    seen.add(res.id);
    filtered.push(res);
  }

  return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
}

/**
 * Obtiene la primera URL accesible para el usuario (usado para redirección tras inicio de sesión o bloqueo).
 */
export function getHomeUrl(user: SessionUser | null | undefined): string {
  if (!user) return "/ingresar";
  if (canPerform(user, "/hub", "view")) return "/hub";
  const menu = getAuthorizedMenu(user);
  return menu[0]?.urlFrontend || "/hub/perfil";
}
