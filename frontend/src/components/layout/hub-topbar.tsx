"use client";

import {
  ArrowRight, ArrowUpRight, Calendar, Camera, Check, ChevronDown, ChevronRight,
  CircleHelp, Command, ExternalLink, FileText, FolderKanban, Inbox,
  Keyboard, LayoutGrid, Menu, Monitor, Moon, Search, Sun, UserRound, X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { AlfaCodeLogo } from "@/components/brand/alfacode-logo";
import { useTheme } from "@/components/theme/theme-provider";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { roleLabel, type SessionUser } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { useHubTopbarMotion } from "./use-hub-topbar-motion";

import "./hub-topbar.css";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
};

type HubTopbarProps = {
  user: SessionUser;
  navigation: NavigationItem[];
  avatar: string | null;
  mobileMenuOpen: boolean;
  hasSidebar: boolean;
  onToggleMobileMenu: () => void;
  onToggleSidebar: () => void;
  onOpenAvatar: () => void;
  onOpenShortcuts: () => void;
};

type Popover = "modules" | "quick" | "account" | null;

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return `${words[0]?.[0] ?? ""}${words.length > 1 ? words.at(-1)?.[0] ?? "" : ""}`.toUpperCase() || "?";
}

function routeDetail(path: string) {
  const segment = path.split("/").filter(Boolean).at(-1);
  const labels: Record<string, string> = {
    tareas: "Tareas", sprints: "Sprints", documentos: "Documentos",
    actividades: "Actividades", investigacion: "Investigación", produccion: "Producción",
  };
  if (path.startsWith("/hub/proyectos/")) return labels[segment ?? ""] ?? "Detalle del proyecto";
  if (path.startsWith("/hub/tramites/")) return "Detalle de la solicitud";
  if (path.startsWith("/hub/integrantes/")) return "Detalle del integrante";
  return null;
}

/** Navegación del HUB: usa los recursos autorizados de la sesión, sin datos operativos simulados. */
export function HubTopbar({
  user, navigation, avatar, mobileMenuOpen, hasSidebar,
  onToggleMobileMenu, onToggleSidebar, onOpenAvatar, onOpenShortcuts,
}: HubTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const id = useId();
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchDialogRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { source, reveal, dismiss, cancel, position, syncAppearance } = useHubTopbarMotion(headerRef, panelRef);
  const [popover, setPopover] = useState<Popover>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "modules" | "actions">("all");
  const [selected, setSelected] = useState(0);
  const [previousPath, setPreviousPath] = useState(pathname);
  const isMac = useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );

  // Cierra las superficies transitorias también al navegar con Atrás/Adelante.
  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setPopover(null);
    setSearchOpen(false);
  }

  const current = navigation
    .filter((item) => pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const CurrentIcon = current?.icon ?? LayoutGrid;
  const detail = routeDetail(pathname);
  const nameParts = user.fullName.trim().split(/\s+/).filter(Boolean);
  const displayName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts.at(-1)}` : nameParts[0] || "Mi cuenta";
  const primaryRole = user.roles.map(roleLabel).join(" · ");
  const shortcuts = [
    { href: "/hub/proyectos", label: "Proyectos", description: "Organiza el trabajo de tu equipo", icon: FolderKanban },
    { href: "/hub/tramites", label: "Trámites y solicitudes", description: "Consulta o registra una solicitud", icon: Inbox },
    { href: "/hub/documentos", label: "Documentos", description: "Accede a tus archivos y entregables", icon: FileText },
    { href: "/hub/actividades", label: "Actividades", description: "Consulta eventos y encuentros del semillero", icon: Calendar },
  ].filter((item) => navigation.some((resource) => resource.href === item.href));

  function navigate(href: string) {
    setPopover(null);
    setSearchOpen(false);
    router.push(href);
  }

  const actions = [
    { id: "profile", label: "Mi perfil", description: "Consulta y actualiza tus datos", icon: UserRound, run: () => navigate("/hub/perfil") },
    { id: "avatar", label: "Cambiar imagen de perfil", description: "Personaliza tu imagen en este dispositivo", icon: Camera, run: onOpenAvatar },
    { id: "portal", label: "Portal público", description: "Conoce el semillero AlfaCode", icon: ExternalLink, run: () => navigate("/") },
    { id: "shortcuts", label: "Atajos de teclado", description: "Navega más rápido por el HUB", icon: Keyboard, run: onOpenShortcuts },
    { id: "theme", label: theme === "dark" ? "Usar tema claro" : "Usar tema oscuro", description: "Cambia la apariencia del espacio", icon: theme === "dark" ? Sun : Moon, run: () => setTheme(theme === "dark" ? "light" : "dark") },
  ];
  const candidates = [
    ...navigation.map((item) => ({ ...item, id: item.href, kind: "modules", run: () => navigate(item.href) })),
    ...actions.map((item) => ({ ...item, kind: "actions" })),
  ];
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const searchTerms = normalize(query).trim().split(/\s+/);
  const results = candidates.filter((item) =>
    (filter === "all" || item.kind === filter) &&
    searchTerms.every((term) => normalize(`${item.label} ${item.description}`).includes(term)),
  );
  const resultGroups = [
    { kind: "modules", label: "Módulos" },
    { kind: "actions", label: "Acciones" },
  ].map((group) => ({ ...group, entries: results.map((item, index) => ({ item, index })).filter(({ item }) => item.kind === group.kind) }))
    .filter((group) => group.entries.length > 0);

  function openSearch() {
    setPopover(null);
    setQuery("");
    setFilter("all");
    setSelected(0);
    setSearchOpen(true);
  }

  const togglePopover = useCallback((next: Exclude<Popover, null>, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    if (popover === next) {
      if (panelRef.current?.inert) reveal(trigger, source.current);
      else dismiss(() => setPopover((current) => current === next ? null : current));
    } else {
      cancel();
      setPopover(next);
    }
  }, [popover, reveal, dismiss, cancel, source]);

  useLayoutEffect(() => {
    if (popover) reveal(triggerRef.current, source.current);
    return cancel;
  }, [popover, reveal, cancel, source]);

  useLayoutEffect(() => {
    syncAppearance();
  }, [theme, popover, syncAppearance]);

  useEffect(() => {
    if (!popover) return;
    const surface = headerRef.current?.querySelector(".hub-bar-deck");
    if (!surface) return;
    const observer = new ResizeObserver(() => {
      position(triggerRef.current);
      syncAppearance(true);
    });
    observer.observe(surface);
    return () => observer.disconnect();
  }, [popover, position, syncAppearance]);

  useEffect(() => {
    if (!popover) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        dismiss(() => setPopover((current) => current === popover ? null : current));
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPopover(null);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [popover, dismiss]);

  useEffect(() => {
    const dialog = searchDialogRef.current;
    if (searchOpen && dialog && !dialog.open) {
      dialog.showModal();
      searchInputRef.current?.focus();
    } else if (!searchOpen && dialog?.open) dialog.close();
  }, [searchOpen]);

  useEffect(() => {
    resultsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selected, query, filter]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const editing = event.target instanceof HTMLElement &&
        (event.target.matches("input, textarea, select") || event.target.isContentEditable);
      if (event.target instanceof Element && event.target.closest("dialog") && !searchDialogRef.current?.contains(event.target)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "j") {
        if (searchDialogRef.current?.open) return;
        event.preventDefault();
        const trigger = headerRef.current?.querySelector<HTMLButtonElement>('[data-trigger="quick"]');
        if (trigger) togglePopover("quick", trigger);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        if (searchDialogRef.current?.open) return;
        if (!hasSidebar && window.matchMedia("(min-width: 1024px)").matches) return;
        event.preventDefault();
        onToggleSidebar();
      } else if (event.key === "?" && !editing) {
        event.preventDefault();
        setPopover(null);
        onOpenShortcuts();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onToggleSidebar, onOpenShortcuts, hasSidebar, togglePopover]);

  const avatarContent = avatar ? (
    // El avatar es un data URL privado del dispositivo, no un recurso remoto optimizable.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatar} alt="" className="hub-bar-avatar-image" />
  ) : getInitials(user.fullName);

  return (
    <>
      <header ref={headerRef} className="hub-bar-topbar" aria-label="Barra del espacio de trabajo">
        <div className="hub-bar-deck">
        <span className="hub-bar-edge-highlight" aria-hidden="true" />
        <svg className="hub-bar-network" viewBox="0 0 800 100" fill="none" aria-hidden="true" focusable="false">
          <path d="M0 76h126l30-30h136l32-32h106m-220 62h160l32-32h156l28-28h214M464 100l28-28h148l26-26h134" />
          <circle cx="126" cy="76" r="3" /><circle cx="292" cy="46" r="3" />
          <circle cx="430" cy="14" r="3" /><circle cx="558" cy="44" r="3" />
          <circle cx="640" cy="72" r="3" />
        </svg>
        <div className="hub-bar-brand-area">
          <button
            type="button" className={cn("hub-bar-icon-button", "hub-bar-mobile-toggle")}
            onClick={onToggleMobileMenu} aria-expanded={mobileMenuOpen}
            aria-controls={hasSidebar ? "app-sidebar-mobile" : "student-navigation"}
            aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          >
            {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
          <Link href="/hub" className="hub-bar-brand" aria-label="AlfaCode HUB, ir al panel">
            <AlfaCodeLogo tone="on-blue" width={174} height={52} alt="AlfaCode, Semillero de Investigación" priority className="hub-bar-logo" />
            <span className="hub-bar-hub-label">HUB</span>
          </Link>
        </div>

        <div className="hub-bar-location">
          <button
            type="button" className="hub-bar-location-button"
            aria-expanded={popover === "modules"} aria-controls={`${id}-modules`}
            onClick={(event) => togglePopover("modules", event.currentTarget)}
            aria-label={`Cambiar de módulo. Actual: ${current?.label ?? "Panel"}`}
          >
            <span className="hub-bar-context-icon"><CurrentIcon size={19} aria-hidden="true" /></span>
            <span className="hub-bar-location-stack">
              <span className="hub-bar-eyebrow">Espacio de trabajo</span>
              <span className="hub-bar-location-trail">
                <span className="hub-bar-location-text">{current?.label ?? "Panel"}</span>
                {detail && <><ChevronRight size={13} className="hub-bar-route-separator" aria-hidden="true" /><span className="hub-bar-route-detail">{detail}</span></>}
              </span>
            </span>
            <ChevronDown size={14} className="hub-bar-chevron" aria-hidden="true" />
          </button>
        </div>

        <button ref={searchTriggerRef} type="button" className="hub-bar-search-trigger" onClick={openSearch} aria-label="Buscar en AlfaCode HUB" aria-keyshortcuts="Control+k Meta+k" aria-haspopup="dialog">
          <span className="hub-bar-search-icon"><Search size={18} aria-hidden="true" /></span>
          <span className="hub-bar-search-copy"><span className="hub-bar-search-placeholder">Buscar en el HUB</span><span className="hub-bar-search-hint">Módulos, vistas y acciones</span></span>
          <kbd className="hub-bar-keycap">{isMac ? "⌘" : "Ctrl"}<span>K</span></kbd>
        </button>

        <div className="hub-bar-tools">
          <button type="button" data-trigger="quick" className="hub-bar-quick-trigger"
            onClick={(event) => togglePopover("quick", event.currentTarget)}
            aria-expanded={popover === "quick"} aria-controls={`${id}-quick`} aria-label="Accesos rápidos" aria-keyshortcuts="Control+j Meta+j"
          >
            <LayoutGrid size={16} aria-hidden="true" /><span>Accesos rápidos</span><ChevronDown size={13} aria-hidden="true" />
          </button>
          <div className="hub-bar-utilities">
            <span className="hub-bar-utility-indicator" aria-hidden="true" />
            <Link href="/" className={cn("hub-bar-icon-button", "hub-bar-portal-link")} title="Ir al portal público" aria-label="Ir al portal público">
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
            <button type="button" className={cn("hub-bar-icon-button", "hub-bar-help-button")} onClick={onOpenShortcuts} title="Atajos de teclado (?)" aria-label="Ver atajos de teclado">
              <CircleHelp size={19} aria-hidden="true" />
            </button>
          </div>
          <span className="hub-bar-tool-divider" aria-hidden="true" />
          <button type="button" className="hub-bar-account-trigger"
            onClick={(event) => togglePopover("account", event.currentTarget)}
            aria-expanded={popover === "account"} aria-controls={`${id}-account`} aria-label="Menú de usuario" title={user.fullName}
          >
            <span className="hub-bar-avatar" aria-hidden="true">{avatarContent}</span>
            <span className="hub-bar-account-text"><span className="hub-bar-account-name">{displayName}</span><span className="hub-bar-account-role">{primaryRole}</span></span>
            <ChevronDown size={14} className="hub-bar-account-chevron" aria-hidden="true" />
          </button>
        </div>

        {popover && (
          <div
            ref={panelRef} id={`${id}-${popover}`} role="region"
            aria-label={popover === "modules" ? "Módulos del HUB" : popover === "quick" ? "Accesos rápidos" : "Opciones de cuenta"}
            className={cn("hub-bar-popover", popover === "modules" ? "hub-bar-modules-popover" : popover === "quick" ? "hub-bar-quick-popover" : "hub-bar-account-popover")}
            onBlur={(event) => {
              if (source.current === "keyboard" && event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== triggerRef.current) setPopover(null);
            }}
            onKeyDown={(event) => {
              if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
              const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'));
              const currentIndex = items.indexOf(document.activeElement as HTMLElement);
              const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
                (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
              event.preventDefault();
              items[next]?.focus();
            }}
          >
            {popover === "modules" && (
              <>
                <div className="hub-bar-popover-heading"><div><span className="hub-bar-panel-eyebrow">TU ESPACIO ALFACODE</span><p>Cambiar de módulo</p></div><span className="hub-bar-counter">{navigation.length} módulos</span></div>
                <nav className="hub-bar-module-list" aria-label="Selector de módulos">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = item.href === current?.href;
                    return (
                      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("hub-bar-menu-item", active && "hub-bar-menu-item-active")} onClick={() => setPopover(null)}>
                        <span className="hub-bar-item-icon"><Icon size={18} aria-hidden="true" /></span>
                        <span className="hub-bar-item-text"><span>{item.label}</span>{item.description && <small>{item.description}</small>}</span>
                        {active && <Check size={16} aria-hidden="true" />}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}

            {popover === "quick" && (
              <>
                <div className="hub-bar-popover-heading"><div><span className="hub-bar-panel-eyebrow">CONTINÚA TU TRABAJO</span><p>Accesos rápidos</p></div><kbd className="hub-bar-keycap">{isMac ? "⌘" : "Ctrl"}<span>J</span></kbd></div>
                <div className="hub-bar-shortcut-grid">
                {shortcuts.map((item) => {
                  const Icon = item.icon;
                  return <Link key={item.href} href={item.href} className="hub-bar-menu-item" onClick={() => setPopover(null)}><span className="hub-bar-item-icon"><Icon size={18} aria-hidden="true" /></span><span className="hub-bar-item-text"><span>{item.label}</span><small>{item.description}</small></span><ArrowRight size={15} aria-hidden="true" /></Link>;
                })}
                </div>
                <button type="button" className="hub-bar-menu-item" onClick={openSearch}><span className="hub-bar-item-icon"><Search size={18} aria-hidden="true" /></span><span className="hub-bar-item-text"><span>Explorar todos los módulos</span><small>Busca una vista o una acción</small></span><ArrowRight size={15} aria-hidden="true" /></button>
              </>
            )}

            {popover === "account" && (
              <div className="hub-bar-account-content">
                <div className="hub-bar-identity">
                  <div className="hub-bar-identity-header">
                    <div className="hub-bar-avatar-wrap">
                      <span className="hub-bar-avatar hub-bar-avatar-lg" aria-hidden="true">{avatarContent}</span>
                      <span className="hub-bar-status-dot" title="En línea" />
                    </div>
                    <div className="hub-bar-identity-info">
                      <p className="hub-bar-identity-name">{user.fullName}</p>
                      <span className="hub-bar-identity-email">{user.email}</span>
                    </div>
                  </div>
                  <div className="hub-bar-roles">
                    {user.roles.map((role) => (
                      <span key={role} className="hub-bar-role-badge">
                        <span className="hub-bar-role-diamond" aria-hidden="true">◆</span>
                        {roleLabel(role)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="hub-bar-menu-list">
                  <Link href="/hub/perfil" className="hub-bar-menu-item" onClick={() => setPopover(null)}>
                    <span className="hub-bar-item-icon"><UserRound size={17} aria-hidden="true" /></span>
                    <span className="hub-bar-item-label">Mi perfil</span>
                    <ChevronRight size={15} className="hub-bar-menu-chevron" aria-hidden="true" />
                  </Link>
                  <button type="button" className="hub-bar-menu-item" onClick={() => { setPopover(null); onOpenAvatar(); }}>
                    <span className="hub-bar-item-icon"><Camera size={17} aria-hidden="true" /></span>
                    <span className="hub-bar-item-label">Cambiar imagen</span>
                  </button>
                  <button type="button" className="hub-bar-menu-item" onClick={() => { setPopover(null); onOpenShortcuts(); }}>
                    <span className="hub-bar-item-icon"><Keyboard size={17} aria-hidden="true" /></span>
                    <span className="hub-bar-item-label">Atajos de teclado</span>
                    <kbd className="hub-bar-keycap">?</kbd>
                  </button>
                  <Link href="/" className="hub-bar-menu-item" onClick={() => setPopover(null)}>
                    <span className="hub-bar-item-icon"><ExternalLink size={17} aria-hidden="true" /></span>
                    <span className="hub-bar-item-label">Portal público</span>
                    <ArrowUpRight size={15} className="hub-bar-menu-arrow" aria-hidden="true" />
                  </Link>
                </div>

                <div className="hub-bar-appearance">
                  <div className="hub-bar-appearance-header">
                    <span className="hub-bar-section-label">APARIENCIA</span>
                    <span className="hub-bar-appearance-hint">Modo visual</span>
                  </div>
                  <div className="hub-bar-theme-options" role="group" aria-label="Apariencia del HUB">
                    <span className="hub-bar-theme-indicator" aria-hidden="true" />
                    {([{ value: "light", label: "Claro", icon: Sun }, { value: "dark", label: "Oscuro", icon: Moon }, { value: "system", label: "Sistema", icon: Monitor }] as const).map((option) => {
                      const Icon = option.icon;
                      return (
                        <button key={option.value} type="button" aria-pressed={theme === option.value} onClick={() => setTheme(option.value)} className={`hub-bar-theme-btn hub-bar-theme-${option.value}`}>
                          <Icon size={15} aria-hidden="true" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="hub-bar-logout"><LogoutButton /></div>
              </div>
            )}
          </div>
        )}
        </div>
      </header>

      {!hasSidebar && (
        <nav aria-label="Menú principal de estudiante" className="hub-bar-student-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} aria-current={current?.href === item.href ? "page" : undefined}><Icon size={16} aria-hidden="true" />{item.label}</Link>;
          })}
        </nav>
      )}

      <dialog ref={searchDialogRef} className="hub-bar-command-dialog" aria-labelledby={`${id}-search-title`}
        onClose={() => { setSearchOpen(false); searchTriggerRef.current?.focus(); }}
        onClick={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}
      >
        {searchOpen && (
          <div className="hub-bar-command-content">
            <h2 id={`${id}-search-title`} className="sr-only">Buscar en AlfaCode HUB</h2>
            <div className="hub-bar-command-input-row">
              <Search size={22} aria-hidden="true" />
              <input ref={searchInputRef} type="text" role="combobox" aria-autocomplete="list" aria-expanded="true"
                aria-controls={`${id}-results`} aria-activedescendant={results[selected] ? `${id}-result-${selected}` : undefined}
                aria-label="Buscar módulos y acciones" placeholder="¿A dónde quieres ir?" autoComplete="off" spellCheck={false}
                value={query} onChange={(event) => { setQuery(event.target.value); setSelected(0); }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelected((value) => (value + (event.key === "ArrowDown" ? 1 : -1) + Math.max(1, results.length)) % Math.max(1, results.length));
                  } else if (event.key === "Enter" && results[selected]) {
                    event.preventDefault(); setSearchOpen(false); results[selected].run();
                  }
                }}
              />
              <button type="button" className="hub-bar-icon-button" onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda"><X size={19} aria-hidden="true" /></button>
            </div>
            <div className="hub-bar-search-filters" role="group" aria-label="Filtrar búsqueda">
              {([{ value: "all", label: "Todo" }, { value: "modules", label: "Módulos" }, { value: "actions", label: "Acciones" }] as const).map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => { setFilter(item.value); setSelected(0); }}>{item.label}</button>)}
              <span role="status">{results.length} {results.length === 1 ? "resultado" : "resultados"}</span>
            </div>
            <div ref={resultsRef} id={`${id}-results`} role="listbox" aria-label="Resultados de búsqueda" className="hub-bar-results">
              {resultGroups.map((group) => <div key={group.kind} role="group" aria-label={group.label} className="hub-bar-result-group">
                <div className="hub-bar-result-group-heading" aria-hidden="true"><span>{group.label}</span><span>{group.entries.length}</span></div>
                {group.entries.map(({ item, index }) => {
                const Icon = item.icon;
                return <button key={item.id} type="button" id={`${id}-result-${index}`} role="option" aria-selected={selected === index} tabIndex={-1}
                  className="hub-bar-result" onPointerMove={() => setSelected(index)} onClick={() => { setSearchOpen(false); item.run(); }}>
                  <span className="hub-bar-item-icon"><Icon size={19} aria-hidden="true" /></span>
                  <span className="hub-bar-item-text"><span>{item.label}</span>{item.description && <small>{item.description}</small>}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>;
              })}</div>)}
            </div>
            {results.length === 0 && <div className="hub-bar-empty-results"><Search size={26} aria-hidden="true" /><p>No encontramos “{query}”</p><span>Prueba con otro nombre o cambia el filtro.</span></div>}
            <div className="hub-bar-search-footer"><Command size={14} aria-hidden="true" /><span>Tu espacio, a un atajo.</span><span><kbd>↑ ↓</kbd> Navegar <kbd>↵</kbd> Abrir <kbd>Esc</kbd> Cerrar</span></div>
          </div>
        )}
      </dialog>
    </>
  );
}
