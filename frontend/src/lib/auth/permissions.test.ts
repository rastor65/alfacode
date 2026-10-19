import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canPerform,
  findResourceByPath,
  getAuthorizedMenu,
  getHomeUrl,
  getRoutePermissions,
  normalizeRoute,
} from "./permissions";
import type { AuthResource, SessionUser } from "./roles";

const MOCK_RESOURCES: AuthResource[] = [
  {
    id: "res-panel-001",
    name: "Panel",
    description: "Vista general",
    urlBackend: "/api/v1/auth/me",
    urlFrontend: "/hub",
    icon: "dashboard",
    order: 1,
    visibleMenu: true,
    canRead: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canExport: false,
    parentId: null,
  },
  {
    id: "res-proyectos-002",
    name: "Proyectos",
    description: "Gestión de proyectos",
    urlBackend: "/api/v1/projects",
    urlFrontend: "/hub/proyectos",
    icon: "folder",
    order: 2,
    visibleMenu: true,
    canRead: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canExport: false,
    parentId: null,
  },
  {
    id: "res-tareas-003",
    name: "Tareas",
    description: "Tablero de tareas",
    urlBackend: "/api/v1/tasks",
    urlFrontend: "/hub/tareas",
    icon: "check-square",
    order: 3,
    visibleMenu: true,
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    canExport: false,
    parentId: null,
  },
  {
    id: "res-integrantes-010",
    name: "Integrantes",
    description: "Directorio de miembros",
    urlBackend: "/api/v1/users",
    urlFrontend: "/hub/integrantes",
    icon: "users",
    order: 10,
    visibleMenu: true,
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    canExport: true,
    parentId: null,
  },
  {
    id: "res-roles-011",
    name: "Roles y Recursos",
    description: "Seguridad y RBAC",
    urlBackend: "/api/v1/roles",
    urlFrontend: "/hub/roles-recursos",
    icon: "shield",
    order: 11,
    visibleMenu: true,
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
    parentId: null,
  },
  {
    id: "res-perfil-012",
    name: "Mi perfil",
    description: "Configuración personal",
    urlBackend: "/api/v1/users/profile",
    urlFrontend: "/hub/perfil",
    icon: "user-round",
    order: 12,
    visibleMenu: false, // Oculto del menú lateral porque está en el menú de usuario del topbar
    canRead: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canExport: false,
    parentId: null,
  },
];

const studentUser: SessionUser = {
  id: "student-1",
  fullName: "Estudiante Demo",
  email: "estudiante@alfacode.org",
  accountStatus: "active",
  mustChangePassword: false,
  roles: ["student"],
  resources: [
    MOCK_RESOURCES[0], // Panel (canRead=true, canCreate=false)
    MOCK_RESOURCES[1], // Proyectos (canRead=true, canCreate=false)
    MOCK_RESOURCES[2], // Tareas (canRead=true, canCreate=true, canUpdate=true)
    MOCK_RESOURCES[5], // Mi perfil (visibleMenu=false)
  ],
  menu: [
    MOCK_RESOURCES[0],
    MOCK_RESOURCES[1],
    MOCK_RESOURCES[2],
  ],
};

const adminUser: SessionUser = {
  id: "admin-1",
  fullName: "Administrador AlfaCode",
  email: "admin@alfacode.org",
  accountStatus: "active",
  mustChangePassword: false,
  roles: ["admin"],
  resources: MOCK_RESOURCES,
  menu: MOCK_RESOURCES.filter((r) => r.visibleMenu),
};

describe("normalizeRoute", () => {
  it("normaliza rutas eliminando barras extras y query params", () => {
    assert.equal(normalizeRoute("/hub/integrantes/"), "/hub/integrantes");
    assert.equal(normalizeRoute("/hub/proyectos?tab=1#resumen"), "/hub/proyectos");
    assert.equal(normalizeRoute("hub/tareas"), "/hub/tareas");
    assert.equal(normalizeRoute(""), "/");
    assert.equal(normalizeRoute(null), "/");
  });
});

describe("findResourceByPath", () => {
  it("encuentra recurso por URL exacta de frontend", () => {
    const res = findResourceByPath(MOCK_RESOURCES, "/hub/integrantes");
    assert.equal(res?.id, "res-integrantes-010");
  });

  it("encuentra recurso por URL exacta de backend", () => {
    const res = findResourceByPath(MOCK_RESOURCES, "/api/v1/roles");
    assert.equal(res?.id, "res-roles-011");
  });

  it("encuentra recurso por prefijo jerárquico", () => {
    const res = findResourceByPath(MOCK_RESOURCES, "/hub/proyectos/proyecto-abc/configuracion");
    assert.equal(res?.id, "res-proyectos-002");
  });

  it("devuelve undefined para rutas desconocidas", () => {
    const res = findResourceByPath(MOCK_RESOURCES, "/ruta-inexistente");
    assert.equal(res, undefined);
  });
});

describe("getRoutePermissions", () => {
  it("otorga acceso completo al administrador en cualquier vista registrada", () => {
    const perms = getRoutePermissions(adminUser, "/hub/roles-recursos");
    assert.equal(perms.canRead, true);
    assert.equal(perms.canCreate, true);
    assert.equal(perms.canUpdate, true);
    assert.equal(perms.canDelete, true);
    assert.equal(perms.canExport, true);
  });

  it("limita los permisos del estudiante según sus recursos asignados", () => {
    // Proyectos: solo lectura
    const permsProyectos = getRoutePermissions(studentUser, "/hub/proyectos");
    assert.equal(permsProyectos.canRead, true);
    assert.equal(permsProyectos.canCreate, false);
    assert.equal(permsProyectos.canUpdate, false);
    assert.equal(permsProyectos.canDelete, false);

    // Tareas: lectura, creación y edición
    const permsTareas = getRoutePermissions(studentUser, "/hub/tareas");
    assert.equal(permsTareas.canRead, true);
    assert.equal(permsTareas.canCreate, true);
    assert.equal(permsTareas.canUpdate, true);
    assert.equal(permsTareas.canDelete, false);

    // Integrantes: no asignado al estudiante -> sin permisos
    const permsIntegrantes = getRoutePermissions(studentUser, "/hub/integrantes");
    assert.equal(permsIntegrantes.canRead, false);
    assert.equal(permsIntegrantes.canCreate, false);
    assert.equal(permsIntegrantes.canUpdate, false);
    assert.equal(permsIntegrantes.canDelete, false);
  });
});

describe("canPerform", () => {
  it("valida acciones individuales con alias en español e inglés", () => {
    assert.equal(canPerform(studentUser, "/hub/proyectos", "ver"), true);
    assert.equal(canPerform(studentUser, "/hub/proyectos", "read"), true);
    assert.equal(canPerform(studentUser, "/hub/proyectos", "crear"), false);
    assert.equal(canPerform(studentUser, "/hub/proyectos", "create"), false);

    assert.equal(canPerform(studentUser, "/hub/tareas", "crear"), true);
    assert.equal(canPerform(studentUser, "/hub/tareas", "editar"), true);
    assert.equal(canPerform(studentUser, "/hub/tareas", "eliminar"), false);

    assert.equal(canPerform(studentUser, "/hub/integrantes", "ver"), false);
    assert.equal(canPerform(adminUser, "/hub/integrantes", "eliminar"), true);
  });
});

describe("getAuthorizedMenu", () => {
  it("filtra únicamente los recursos visibles en menú y con permiso de lectura", () => {
    const studentMenu = getAuthorizedMenu(studentUser);
    const menuNames = studentMenu.map((m) => m.name);

    assert.deepEqual(menuNames, ["Panel", "Proyectos", "Tareas"]);
    // Integrantes y Roles no están autorizados
    assert.ok(!menuNames.includes("Integrantes"));
    assert.ok(!menuNames.includes("Roles y Recursos"));
    // Mi perfil está oculto del menú (visibleMenu: false)
    assert.ok(!menuNames.includes("Mi perfil"));
  });

  it("mantiene el orden numérico de los recursos", () => {
    const adminMenu = getAuthorizedMenu(adminUser);
    const orders = adminMenu.map((m) => m.order);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    assert.deepEqual(orders, sortedOrders);
  });
});

describe("getHomeUrl", () => {
  it("redirige al Panel si tiene acceso", () => {
    assert.equal(getHomeUrl(studentUser), "/hub");
    assert.equal(getHomeUrl(adminUser), "/hub");
  });

  it("redirige a login si no hay usuario", () => {
    assert.equal(getHomeUrl(null), "/ingresar");
  });
});
