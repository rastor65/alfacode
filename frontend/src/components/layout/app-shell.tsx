"use client";

import {
  Award, Calendar, Check, CheckSquare, ChevronLeft, ChevronRight,
  FileText, FlaskConical, FolderKanban, Inbox, LayoutDashboard,
  Repeat, Shield, Trash2, Upload, UserPlus, UserRound, Users, X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AlfaCodeLogo } from "@/components/brand/alfacode-logo";
import { HubTopbar } from "@/components/layout/hub-topbar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getAuthorizedMenu } from "@/lib/auth/permissions";
import { PermissionsProvider } from "@/lib/auth/permissions-context";
import { type RoleCode, type SessionUser } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

import "./hub-sidebar.css";
import { useHubSidebarMotion } from "./use-hub-sidebar-motion";

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
  { href: "/hub", label: "Panel", description: "Tu cuenta y accesos al semillero", icon: LayoutDashboard, exact: true },
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [studentNavOpen, setStudentNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    sidebarDeckRef,
    navListRef,
    activePillRef,
    beamRef,
    contentRef,
    syncActivePill,
  } = useHubSidebarMotion();

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

  const isMac = useSyncExternalStore(
    () => () => { },
    () => typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );

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

  const drawerRef = useRef<HTMLElement>(null);
  const hasSidebar = user.roles.some((role) => ["admin", "coordinator", "teacher_leader"].includes(role));
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  const toggleMobileMenu = () => {
    if (hasSidebar) setMenuOpen((open) => !open);
    else setStudentNavOpen((open) => !open);
  };

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 1024px)").matches && hasSidebar) {
      setSidebarCollapsed((collapsed) => {
        const next = !collapsed;
        setTimeout(() => syncActivePill(true), 210);
        return next;
      });
    } else toggleMobileMenu();
  };

  useEffect(() => {
    if (!menuOpen && !studentNavOpen) return;
    const drawer = hasSidebar ? drawerRef.current : document.getElementById("student-navigation");
    const trigger = document.querySelector<HTMLButtonElement>('[aria-controls="' + (hasSidebar ? 'app-sidebar-mobile' : 'student-navigation') + '"]');
    drawer?.querySelector<HTMLElement>("a, button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setStudentNavOpen(false);
        trigger?.focus();
      }
      if (event.key === "Tab" && hasSidebar && drawer) {
        const controls = Array.from(drawer.querySelectorAll<HTMLElement>("a, button"));
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, studentNavOpen, hasSidebar]);

  const handleOpenAvatarModal = () => {
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

  const renderSidebar = (isCollapsed: boolean, isMobile = false) => (
    <div className="flex h-full flex-col min-h-0">
      <span className="hub-sidebar-edge-highlight" aria-hidden="true" />
      <svg className="hub-sidebar-network" viewBox="0 0 240 600" fill="none" aria-hidden="true" focusable="false">
        <path d="M20 0v80l24 24v120l-16 16v90m150-330v140l-28 28v160l20 20v90M80 0v160l32 32v180l-20 20v208" />
        <circle cx="20" cy="80" r="3" />
        <circle cx="44" cy="224" r="3" />
        <circle cx="28" cy="330" r="3" />
        <circle cx="194" cy="140" r="3" />
        <circle cx="166" cy="328" r="3" />
        <circle cx="112" cy="192" r="3" />
        <circle cx="92" cy="392" r="3" />
      </svg>

      {/* Cabecera del sidebar */}
      {isMobile ? (
        <div className="hub-sidebar-mobile-header">
          <Link href="/hub" className="hub-bar-brand" onClick={() => setMenuOpen(false)} aria-label="AlfaCode HUB, ir al panel">
            <AlfaCodeLogo tone="on-blue" width={140} height={42} alt="AlfaCode" className="hub-bar-logo" />
            <span className="hub-bar-hub-label">HUB</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="hub-bar-icon-button"
            aria-label="Cerrar menú"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      ) : isCollapsed ? (
        <div className="hub-sidebar-header-collapsed" title="Espacio AlfaCode">
          <span className="hub-sidebar-status-dot" aria-hidden="true" />
        </div>
      ) : (
        <div className="hub-sidebar-header">
          <span className="hub-sidebar-eyebrow">Navegación</span>
          <span className="hub-sidebar-counter">{dynamicNavItems.length} vistas</span>
        </div>
      )}

      {/* Navegación */}
      <nav aria-label="Menú principal" className="hub-sidebar-nav">
        <div className="hub-sidebar-nav-inner">
          {!isMobile && (
            <span ref={activePillRef} className="hub-sidebar-active-pill" aria-hidden="true" />
          )}
          <ul ref={!isMobile ? navListRef : undefined} className="hub-sidebar-list">
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
                      "hub-sidebar-item",
                      isCollapsed && "hub-sidebar-item-collapsed",
                      active && "hub-sidebar-item-active",
                    )}
                  >
                    <span className="hub-sidebar-item-icon">
                      <Icon size={isCollapsed ? 18 : 17} aria-hidden="true" />
                    </span>
                    {!isCollapsed && <span className="hub-sidebar-item-label">{item.label}</span>}
                    {!isCollapsed && active && <span className="hub-sidebar-active-indicator" aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Pie del sidebar */}
      {!isMobile && (
        isCollapsed ? (
          <div className="hub-sidebar-footer-collapsed" title="AlfaCode HUB (Ctrl+B para expandir)">
            <span className="hub-sidebar-status-dot" aria-hidden="true" />
          </div>
        ) : (
          <div className="hub-sidebar-footer">
            <span className="hub-sidebar-status-pill">
              <span className="hub-sidebar-status-dot" aria-hidden="true" />
              AlfaCode HUB
            </span>
            <kbd className="hub-sidebar-keycap" title="Atajo para comprimir o expandir el menú lateral">
              {isMac ? "⌘" : "Ctrl"}<span>B</span>
            </kbd>
          </div>
        )
      )}
    </div>
  );

  return (
    <PermissionsProvider user={user}>
      <div className={cn("hub-bar-workspace", "min-h-screen bg-hub-bg")}>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-hub-panel focus:px-3 focus:py-2 focus:text-sm focus:text-hub-text focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        Saltar al contenido
      </a>

      <HubTopbar
        user={user}
        navigation={dynamicNavItems}
        avatar={customAvatar}
        hasSidebar={hasSidebar}
        mobileMenuOpen={hasSidebar ? menuOpen : studentNavOpen}
        onToggleMobileMenu={toggleMobileMenu}
        onToggleSidebar={toggleSidebar}
        onOpenAvatar={handleOpenAvatarModal}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      {!hasSidebar && studentNavOpen && (
        <div className="border-b border-hub-border bg-hub-chrome px-4 py-3 shadow-lg lg:hidden">
          <nav id="student-navigation" aria-label="Navegación móvil de estudiante">
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
            className="hub-sidebar-mobile-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            ref={drawerRef}
            id="app-sidebar-mobile"
            aria-label="Menú"
            className="hub-sidebar-drawer hub-sidebar-mobile-drawer"
          >
            <div className="hub-sidebar-deck hub-sidebar-mobile-deck">
              {renderSidebar(false, true)}
            </div>
          </aside>
        </div>
      )}

      {/* Contenedor principal */}
      <div className="flex relative">
        {hasSidebar && (
          <aside
            className={cn(
              "hub-sidebar-container hidden lg:block",
              sidebarCollapsed ? "w-[76px]" : "w-64",
            )}
          >
            {/* Haz de luz direccional emitido desde el aside hacia el contenido */}
            <div ref={beamRef} className="hub-sidebar-beam" aria-hidden="true" />

            <div ref={sidebarDeckRef} className="hub-sidebar-deck">
              {renderSidebar(sidebarCollapsed, false)}
            </div>

            {/* Botón para comprimir / expandir en el borde derecho del deck */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Expandir menú lateral (Ctrl+B)" : "Comprimir menú lateral (Ctrl+B)"}
              title={sidebarCollapsed ? "Expandir menú lateral (Ctrl+B)" : "Comprimir menú lateral (Ctrl+B)"}
              className="hub-sidebar-toggle"
            >
              {sidebarCollapsed ? (
                <ChevronRight size={13} aria-hidden="true" />
              ) : (
                <ChevronLeft size={13} aria-hidden="true" />
              )}
            </button>
          </aside>
        )}
        <main
          id="contenido"
          tabIndex={-1}
          className={cn("min-w-0 flex-1 bg-hub-bg px-4 py-8 focus:outline-none sm:px-8 lg:px-10", !hasSidebar && "w-full")}
        >
          <div ref={contentRef} className="hub-content-view">
            {children}
          </div>
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
                <p className="text-[11px] text-hub-muted">Selecciona un archivo de tu dispositivo</p>
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




            {/* Modal de Atajos de Teclado del HUB */}
      <Modal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        title="Atajos de Teclado del HUB"
        description="Acelera tu flujo de trabajo en el semillero AlfaCode con estos comandos rápidos."
      >
        <div className="space-y-4 py-2">
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 dark:bg-cyan-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-hub-text">Buscar en el HUB</span>
                <kbd className="rounded border border-cyan-500/30 bg-white dark:bg-[#061524] px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-300">
                  {isMac ? "⌘K" : "Ctrl+K"}
                </kbd>
              </div>
              <p className="text-[11px] text-hub-muted">Abre el buscador instantáneo de módulos, vistas y acciones.</p>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 dark:bg-cyan-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-hub-text">Accesos rápidos</span>
                <kbd className="rounded border border-cyan-500/30 bg-white dark:bg-[#061524] px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-300">
                  {isMac ? "⌘J" : "Ctrl+J"}
                </kbd>
              </div>
              <p className="text-[11px] text-hub-muted">Despliega el menú de accesos a proyectos, solicitudes y documentos.</p>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 dark:bg-cyan-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-hub-text">Alternar navegación</span>
                <kbd className="rounded border border-cyan-500/30 bg-white dark:bg-[#061524] px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-300">
                  {isMac ? "⌘B" : "Ctrl+B"}
                </kbd>
              </div>
              <p className="text-[11px] text-hub-muted">Comprime la barra lateral o abre el menú en pantallas pequeñas.</p>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 dark:bg-cyan-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-hub-text">Guía de Atajos</span>
                <kbd className="rounded border border-cyan-500/30 bg-white dark:bg-[#061524] px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-300">
                  ?
                </kbd>
              </div>
              <p className="text-[11px] text-hub-muted">Muestra este cuadro de diálogo con los comandos disponibles.</p>
            </div>

            <div className="rounded-xl border border-hub-border/40 bg-hub-hover/20 p-3 sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-hub-text">Cerrar ventanas y popovers</span>
                <kbd className="rounded border border-hub-border bg-white dark:bg-[#061524] px-1.5 py-0.5 font-mono text-[10px] font-bold text-hub-text">
                  Esc
                </kbd>
              </div>
              <p className="text-[11px] text-hub-muted">Cierra inmediatamente cualquier menú flotante, búsqueda o modal activo.</p>
            </div>
          </div>

          <div className="flex justify-end border-t border-hub-border/40 pt-3">
            <Button type="button" variant="primary" onClick={() => setShortcutsModalOpen(false)}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>

      </div>
    </PermissionsProvider>
  );
}

