"use client";

import {
  Award,
  Calendar,
  Camera,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  Monitor,
  Moon,
  Palette,
  Repeat,
  Search,
  Shield,
  Sun,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getAuthorizedMenu } from "@/lib/auth/permissions";
import { PermissionsProvider } from "@/lib/auth/permissions-context";
import { type RoleCode, type SessionUser, roleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Si se indica, el enlace solo se muestra a esos roles. Es solo presentacion: el backend autoriza. */
  roles?: RoleCode[];
  /** Solo se marca activo en esa ruta exacta (la portada `/hub` es prefijo de todas). */
  exact?: boolean;
};

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

function getResourceIcon(iconName: string | null): LucideIcon {
  if (!iconName) return LayoutDashboard;
  return ICON_MAP[iconName.toLowerCase()] ?? LayoutDashboard;
}

/** Menú de respaldo si aún no se ha cargado el RBAC dinámico del backend. */
const NAVIGATION: NavigationItem[] = [
  { href: "/hub", label: "Panel", description: "Métricas y resumen general del semillero", icon: LayoutDashboard, exact: true },
  { href: "/hub/proyectos", label: "Proyectos", description: "Gestión de proyectos tradicionales y tableros ágiles", icon: FolderKanban },
  { href: "/hub/investigacion", label: "Investigación", description: "Líneas de investigación y semilleros vinculados", icon: FlaskConical },
  { href: "/hub/documentos", label: "Documentos", description: "Repositorio institucional de archivos y actas", icon: FileText },
  { href: "/hub/produccion", label: "Producción académica", description: "Artículos, ponencias y reconocimientos del grupo", icon: Award },
  { href: "/hub/actividades", label: "Eventos y actividades", description: "Calendario y registro de actividades académicas", icon: Calendar },
  { href: "/hub/integrantes", label: "Integrantes", description: "Directorio de miembros y roles del semillero", icon: Users },
  { href: "/hub/tramites", label: "Trámites y solicitudes", description: "Gestión de certificados y solicitudes institucionales", icon: Inbox },
  { href: "/hub/solicitudes", label: "Vinculaciones", description: "Aprobación de nuevas vinculaciones y solicitudes", icon: UserPlus, roles: ["admin", "coordinator"] },
  { href: "/hub/roles-recursos", label: "Roles y Recursos", description: "Administración de seguridad, permisos y matriz RBAC", icon: Shield, roles: ["admin"] },
  { href: "/hub/perfil", label: "Mi perfil", description: "Datos de tu cuenta y configuración personal", icon: UserRound },
];

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

type AppShellProps = {
  user: SessionUser;
  children: React.ReactNode;
};

/**
 * Estructura de las vistas privadas:
 * - Docentes y Administrativos (admin, coordinator, teacher_leader): Menú lateral aside con todas las vistas autorizadas.
 * - Estudiantes: Sin aside; menú de navegación horizontal dinámico en el topbar y menú desplegable de usuario.
 * Todo el menú es completamente dinámico y depende de los roles y recursos del usuario (RBAC).
 */
export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [studentNavOpen, setStudentNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Menú dinámico basado estrictamente en los recursos autorizados del usuario (RBAC)
  const authorizedResources = getAuthorizedMenu(user);
  const dynamicNavItems: NavigationItem[] =
    authorizedResources.length > 0
      ? authorizedResources.map((resource) => ({
          href: resource.urlFrontend || "#",
          label: resource.name,
          description: resource.description || "",
          icon: getResourceIcon(resource.icon),
          exact: resource.urlFrontend === "/hub",
        }))
      : NAVIGATION.filter((item) => !item.roles || item.roles.some((role) => user.roles.includes(role)));

  // Buscador de módulos
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Avatar personalizado (sincronizado con localStorage vía useSyncExternalStore)
  const avatarStorageKey = `alfacode_avatar_${user.id}`;
  const customAvatar = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => {
      try {
        return localStorage.getItem(avatarStorageKey);
      } catch {
        return null;
      }
    },
    () => null,
  );

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarFileError, setAvatarFileError] = useState<string | null>(null);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null);

  // Docentes y Administrativos tienen aside por el volumen de vistas del sistema
  const isStaff = user.roles.some((role) => ["admin", "coordinator", "teacher_leader"].includes(role));
  const hasSidebar = isStaff;

  const filteredModules = dynamicNavItems.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.href.toLowerCase().includes(q)
    );
  });

  // Atajo global Ctrl+K o Cmd+K para abrir el buscador de módulos
  useEffect(() => {
    const onGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", onGlobalKeyDown);
    return () => document.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  // Clic fuera del buscador de módulos para cerrarlo
  useEffect(() => {
    if (!searchOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);

  // Manejo de teclado (Escape) y foco para el drawer lateral de docentes/administrativos
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // Manejo de clic fuera y Escape para el menú de usuario (todos los roles)
  useEffect(() => {
    if (!userMenuOpen && !studentNavOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setStudentNavOpen(false);
        userMenuTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen, studentNavOpen]);

  const handleSelectModule = (href: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev + 1) % Math.max(1, filteredModules.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev - 1 + filteredModules.length) % Math.max(1, filteredModules.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredModules[selectedSearchIndex];
      if (target) {
        handleSelectModule(target.href);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const handleOpenAvatarModal = () => {
    setUserMenuOpen(false);
    setAvatarPreview(customAvatar);
    setAvatarFileError(null);
    setAvatarModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarFileError("El archivo debe ser una imagen (PNG, JPG o WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarFileError("La imagen no debe superar los 2 MB.");
      return;
    }

    setAvatarFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = () => {
    try {
      if (avatarPreview) {
        localStorage.setItem(avatarStorageKey, avatarPreview);
      } else {
        localStorage.removeItem(avatarStorageKey);
      }
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignorar en entornos sin almacenamiento persistente
    }
    setAvatarModalOpen(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    try {
      localStorage.removeItem(avatarStorageKey);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignorar
    }
  };

  const renderSidebar = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col">
      <nav aria-label="Menú principal" className="flex-1">
        <ul className={cn("space-y-0.5", isCollapsed && "space-y-1.5")}>
          {dynamicNavItems.map((item) => {
            const active = pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                    isCollapsed
                      ? "size-10 justify-center mx-auto"
                      : "gap-2.5 px-3 py-2 text-sm",
                    active
                      ? "bg-white font-semibold text-hub-accent shadow-xs border border-hub-border/60 dark:bg-hub-accent/15 dark:text-hub-accent dark:border-hub-accent/30"
                      : "text-hub-muted hover:bg-white/60 hover:text-hub-text dark:hover:bg-hub-hover dark:hover:text-hub-text",
                  )}
                >
                  <Icon
                    size={isCollapsed ? 18 : 17}
                    aria-hidden="true"
                    className={cn("shrink-0", active ? "text-hub-accent" : undefined)}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <PermissionsProvider user={user}>
      <div className="min-h-screen bg-hub-bg">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-hub-panel focus:px-3 focus:py-2 focus:text-sm focus:text-hub-text focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        Saltar al contenido
      </a>

      {/* Header / Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-hub-border bg-hub-chrome/95 px-4 backdrop-blur-md sm:px-6 shadow-xs">
        {/* Izquierda: Toggle móvil y Logotipo */}
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          {hasSidebar ? (
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="app-sidebar-mobile"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStudentNavOpen((open) => !open)}
              className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 lg:hidden"
              aria-expanded={studentNavOpen}
              aria-label={studentNavOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            >
              {studentNavOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          )}

          <Link
            href="/hub"
            className="flex min-w-0 items-center gap-2 rounded-md text-sm font-semibold tracking-tight text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <AlfaCodeSymbol className="size-5 shrink-0" />
            <span className="truncate">
              AlfaCode <span className="font-normal text-hub-muted">HUB</span>
            </span>
          </Link>
        </div>

        {/* Centro: Buscador de módulos y navegación horizontal para estudiantes */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-3 max-w-2xl mx-auto">
          {/* Buscador de módulos interactivo */}
          <div ref={searchContainerRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-hub-muted pointer-events-none" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                  setSelectedSearchIndex(0);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar módulo... (Ctrl + K)"
                aria-label="Buscar módulo en el sistema"
                className="h-9 w-full rounded-xl border border-hub-border bg-white/90 pl-8 pr-14 text-xs text-hub-text placeholder:text-hub-muted transition hover:border-hub-border/80 hover:bg-white focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:bg-hub-bg/60 dark:hover:bg-hub-bg/80 dark:focus:bg-hub-bg"
              />
              <kbd className="absolute right-2.5 hidden rounded border border-hub-border bg-hub-hover px-1.5 py-0.5 text-[10px] font-mono text-hub-muted pointer-events-none sm:inline-block">
                Ctrl K
              </kbd>
            </div>

            {searchOpen && (
              <div
                role="listbox"
                aria-label="Módulos encontrados"
                className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-80 overflow-y-auto rounded-2xl border border-hub-border bg-hub-chrome p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
              >
                {filteredModules.length > 0 ? (
                  <ul className="space-y-0.5">
                    {filteredModules.map((item, index) => {
                      const Icon = item.icon;
                      const isSelected = index === selectedSearchIndex;

                      return (
                        <li key={item.href} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => handleSelectModule(item.href)}
                            onMouseEnter={() => setSelectedSearchIndex(index)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition",
                              isSelected
                                ? "bg-hub-hover text-hub-text"
                                : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                            )}
                          >
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
                              <Icon size={14} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-hub-text">{item.label}</p>
                              {item.description && (
                                <p className="truncate text-[11px] text-hub-muted">{item.description}</p>
                              )}
                            </div>
                            <span className="text-[10px] text-hub-muted/70 font-mono">Ir</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="py-4 text-center text-xs text-hub-muted">
                    No se encontraron módulos con &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opciones del menú del estudiante en el Topbar (Desktop) */}
          {!hasSidebar && (
            <nav
              aria-label="Menú principal de estudiante"
              className="hidden xl:flex items-center gap-1 rounded-xl border border-hub-border/60 bg-hub-hover/30 p-1 shrink-0"
            >
              {dynamicNavItems.map((item) => {
                const active = pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                      active
                        ? "bg-hub-hover font-semibold text-hub-text shadow-sm"
                        : "text-hub-muted hover:bg-hub-hover/80 hover:text-hub-text",
                    )}
                  >
                    <Icon size={14} aria-hidden="true" className={active ? "text-hub-accent" : undefined} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Derecha: Menú de usuario unificado con submenú */}
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <div ref={userMenuRef} className="relative">
            <button
              ref={userMenuTriggerRef}
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label="Menú de usuario"
              className="flex items-center gap-2 rounded-full border border-hub-border/80 bg-hub-hover/20 p-1 pl-2.5 text-xs text-hub-text transition hover:bg-hub-hover hover:border-hub-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <div className="hidden min-w-0 text-right sm:block pr-1">
                <p className="truncate text-xs font-semibold leading-tight text-hub-text max-w-[130px]">{user.fullName}</p>
                <p className="truncate text-[10px] text-hub-muted leading-tight">{user.roles.map(roleLabel).join(" · ")}</p>
              </div>
              <span
                className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-hub-accent-soft text-xs font-bold text-hub-accent ring-1 ring-hub-border/80"
                aria-hidden="true"
              >
                {customAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customAvatar} alt={user.fullName} className="size-full object-cover" />
                ) : (
                  initials(user.fullName)
                )}
              </span>
              <ChevronDown
                size={13}
                className={cn(
                  "mr-1 text-hub-muted transition-transform duration-200",
                  userMenuOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                aria-label="Opciones de cuenta"
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-hub-border bg-hub-chrome p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Cabecera del usuario */}
                <div className="border-b border-hub-border px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-hub-accent-soft text-sm font-bold text-hub-accent ring-1 ring-hub-border">
                      {customAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={customAvatar} alt={user.fullName} className="size-full object-cover" />
                      ) : (
                        initials(user.fullName)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-hub-text">{user.fullName}</p>
                      <p className="truncate text-xs text-hub-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-md bg-hub-accent-soft px-2 py-0.5 text-[10px] font-medium text-hub-accent"
                      >
                        {roleLabel(role)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Opciones de perfil */}
                <div className="py-1.5 space-y-0.5">
                  <Link
                    href="/hub/perfil"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-hub-text transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <UserRound size={15} className="text-hub-accent" aria-hidden="true" />
                    <span>Mi perfil</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleOpenAvatarModal}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-hub-text transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <Camera size={15} className="text-hub-accent" aria-hidden="true" />
                    <span>Cambiar imagen de perfil</span>
                  </button>
                </div>

                {/* Color del sistema (Tema) */}
                <div className="border-t border-hub-border px-3 py-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-hub-muted">
                      Color del sistema
                    </span>
                    <Palette size={13} className="text-hub-muted" aria-hidden="true" />
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-hub-hover/40 p-1 border border-hub-border/60">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition",
                        theme === "light"
                          ? "bg-hub-bg text-hub-text shadow-sm ring-1 ring-hub-border"
                          : "text-hub-muted hover:text-hub-text hover:bg-hub-bg/50"
                      )}
                    >
                      <Sun size={14} className={theme === "light" ? "text-amber-500" : undefined} />
                      <span>Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition",
                        theme === "dark"
                          ? "bg-hub-bg text-hub-text shadow-sm ring-1 ring-hub-border"
                          : "text-hub-muted hover:text-hub-text hover:bg-hub-bg/50"
                      )}
                    >
                      <Moon size={14} className={theme === "dark" ? "text-indigo-400" : undefined} />
                      <span>Oscuro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition",
                        theme === "system"
                          ? "bg-hub-bg text-hub-text shadow-sm ring-1 ring-hub-border"
                          : "text-hub-muted hover:text-hub-text hover:bg-hub-bg/50"
                      )}
                    >
                      <Monitor size={14} className={theme === "system" ? "text-cyan-500" : undefined} />
                      <span>Sistema</span>
                    </button>
                  </div>
                </div>

                {/* Cerrar sesión */}
                <div className="border-t border-hub-border pt-1">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navegación móvil para Estudiantes */}
      {!hasSidebar && studentNavOpen && (
        <div className="border-b border-hub-border bg-hub-chrome px-4 py-3 shadow-lg lg:hidden">
          <nav aria-label="Navegación móvil de estudiante">
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {dynamicNavItems.map((item) => {
                const active = pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setStudentNavOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
                        active
                          ? "bg-hub-hover font-semibold text-hub-text shadow-sm"
                          : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                      )}
                    >
                      <Icon size={15} aria-hidden="true" className={active ? "text-hub-accent" : undefined} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}

      {/* Drawer móvil para Docentes y Administrativos */}
      {hasSidebar && menuOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            ref={drawerRef}
            id="app-sidebar-mobile"
            aria-label="Menú"
            className="fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] overflow-y-auto border-r border-hub-border bg-hub-chrome p-4 shadow-xl"
          >
            {renderSidebar(false)}
          </aside>
        </div>
      )}

      {/* Contenedor principal */}
      <div className="flex">
        {hasSidebar && (
          <aside
            className={cn(
              "relative sticky top-14 z-40 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-hub-border bg-hub-chrome shadow-xs transition-[width] duration-200 ease-in-out lg:block",
              sidebarCollapsed ? "w-16 p-2" : "w-60 p-3",
            )}
          >
            {/* Botón para comprimir / expandir en la intersección entre el aside y el topbar */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Expandir menú lateral" : "Comprimir menú lateral"}
              title={sidebarCollapsed ? "Expandir menú lateral" : "Comprimir menú lateral"}
              className="absolute -right-3 top-0 -translate-y-1/2 z-50 flex size-6 items-center justify-center rounded-full border border-hub-border bg-white text-hub-muted shadow-sm transition hover:scale-110 hover:border-hub-accent/40 hover:bg-hub-hover hover:text-hub-text active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-hub-chrome"
            >
              {sidebarCollapsed ? (
                <ChevronRight size={13} aria-hidden="true" />
              ) : (
                <ChevronLeft size={13} aria-hidden="true" />
              )}
            </button>

            <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden">
              {renderSidebar(sidebarCollapsed)}
            </div>
          </aside>
        )}
        <main
          id="contenido"
          tabIndex={-1}
          className={cn("min-w-0 flex-1 bg-hub-bg px-4 py-8 focus:outline-none sm:px-8 lg:px-10", !hasSidebar && "w-full")}
        >
          {children}
        </main>
      </div>

      {/* Modal para cambiar imagen de perfil */}
      <Modal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        title="Cambiar imagen de perfil"
        description="Personaliza tu foto de perfil visible en el HUB."
      >
        <div className="space-y-5 py-2">
          {/* Vista previa central */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative size-24 overflow-hidden rounded-full border-2 border-hub-border bg-hub-accent-soft shadow-inner">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Vista previa del avatar" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-2xl font-bold text-hub-accent">
                  {initials(user.fullName)}
                </span>
              )}
            </div>
            <p className="text-xs text-hub-muted text-center">
              Formatos permitidos: JPG, PNG o WebP. Máximo 2 MB.
            </p>
          </div>

          {avatarFileError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
              {avatarFileError}
            </div>
          )}

          {/* Input de archivo */}
          <div className="space-y-2">
            <label
              htmlFor="avatar-file-input"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hub-border bg-hub-hover/20 p-4 text-center transition hover:border-hub-accent/60 hover:bg-hub-hover/40 focus-within:border-hub-accent focus-within:ring-2 focus-within:ring-cyan-500"
            >
              <Upload size={20} className="text-hub-muted" aria-hidden="true" />
              <div>
                <span className="text-xs font-medium text-hub-text">Haz clic para seleccionar una foto</span>
                <p className="text-[11px] text-hub-muted">o arrastra un archivo aquí</p>
              </div>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hub-border pt-4">
            {avatarPreview ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemoveAvatar}
                className="text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash2 size={14} className="mr-1.5" aria-hidden="true" />
                Restablecer a iniciales
              </Button>
            ) : (
              <span />
            )}

            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="ghost" onClick={() => setAvatarModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={handleSaveAvatar}>
                <Check size={14} className="mr-1.5" aria-hidden="true" />
                Guardar imagen
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      </div>
    </PermissionsProvider>
  );
}

