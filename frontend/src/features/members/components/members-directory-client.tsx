"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CircleCheck,
  CirclePlus,
  Clock,
  Copy,
  ExternalLink,
  Info,
  KeyRound,
  LoaderCircle,
  Lock,
  RefreshCw,
  Search,
  Shield,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { primaryButton } from "@/features/documents/components/document-ui";
import { type CredentialsResult, CredentialsNotice } from "@/features/membership/components/credentials-notice";
import type { TemporaryCredentials } from "@/features/membership/types";
import { chip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { KpiCard } from "@/features/tracking/components/kpi-card";
import { plural } from "@/features/tracking/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { type RoleCode, canManageMember, roleLabel, ROLE_CODES } from "@/lib/auth/roles";
import type { ResourcePermissions } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/permissions-context";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { roleToggles } from "../role-toggles";
import { type AccountStatus, type MemberDetail, type MemberListItem } from "../types";
import { InviteForm } from "./invite-form";

export type QuickFilterTab = "all" | "active" | "inactive" | "pending-password" | "pending" | "rejected";
export type SortField = "name" | "email" | "status";
export type SortDirection = "asc" | "desc";
export type DetailTab = "profile" | "roles";

type Actor = { id: string; roles: RoleCode[] };

interface MembersDirectoryClientProps {
  initialMembers: MemberListItem[];
  actor: Actor;
  authority: boolean;
  permissions?: ResourcePermissions;
  statusCounts: {
    all: number;
    active: number;
    inactive: number;
    pending: number;
    rejected: number;
    pendingPassword: number;
  };
}

const STATUS_LABEL: Record<AccountStatus, string> = { active: "Activo", pending: "Pendiente", inactive: "Inactivo", rejected: "Rechazado" };
const STATUS_TONE: Record<AccountStatus, string> = {
  active: `${chip} bg-hub-success-bg text-hub-success-text`,
  pending: `${chip} bg-hub-info-bg text-hub-info-text`,
  inactive: neutralChip,
  rejected: `${chip} bg-hub-danger-bg text-hub-danger-text`,
};
const ROLE_DESCRIPTIONS: Partial<Record<RoleCode, string>> = {
  admin: "Control y administración total de la plataforma.",
  coordinator: "Gestión de proyectos, solicitudes y miembros.",
  teacher_leader: "Supervisión docente de actividades de investigación.",
  researcher: "Publicación y desarrollo de líneas de investigación.",
  student: "Participación activa en proyectos y semillero.",
};
const SORT_OPTIONS: { value: string; label: string; field: SortField; direction: SortDirection }[] = [
  { value: "name-asc", label: "Nombre (A-Z)", field: "name", direction: "asc" },
  { value: "name-desc", label: "Nombre (Z-A)", field: "name", direction: "desc" },
  { value: "email-asc", label: "Correo institucional", field: "email", direction: "asc" },
  { value: "status-asc", label: "Estado de la cuenta", field: "status", direction: "asc" },
];

const controlClass = "min-h-10 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";
const iconAction =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-50";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** Autoridades en el tono de acento; el resto, neutro: el rol se lee por su texto, no por el color. */
function roleChip(role: RoleCode) {
  return role === "admin" || role === "coordinator" ? `${chip} bg-hub-accent-soft text-hub-accent` : neutralChip;
}

const usernameOf = (member: { email?: string; fullName: string }) =>
  member.email ? member.email.split("@")[0] : member.fullName.toLowerCase().replace(/\s+/g, ".");

export function MembersDirectoryClient({ initialMembers, actor, authority, permissions, statusCounts }: MembersDirectoryClientProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const contextPermissions = usePermissions("/hub/integrantes");
  const effectivePermissions = permissions ?? contextPermissions.permissions;
  const canCreate = effectivePermissions.canCreate;
  const canUpdate = effectivePermissions.canUpdate;

  // Estados de datos y filtros
  const [members, setMembers] = useState<MemberListItem[]>(initialMembers);
  const [loading, setLoading] = useState(false);
  const [quickTab, setQuickTab] = useState<QuickFilterTab>("all");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleCode | "all">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Copiado al portapapeles
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de detalle
  const [selectedUser, setSelectedUser] = useState<MemberListItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("profile");
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Modal de invitacion
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Acciones administrativas
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResult | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const currentDetailId = useRef<string | null>(null);

  // Sincronizar initialMembers cuando cambian las props
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMembers(initialMembers);
  }, [initialMembers]);

  // Atajo de teclado Ctrl+K / Cmd+K para el buscador
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Metricas computadas
  const totalCount = members.length;
  const activeCount = useMemo(() => members.filter((m) => m.accountStatus === "active").length, [members]);
  const inactiveCount = useMemo(() => members.filter((m) => m.accountStatus === "inactive" || m.accountStatus === "rejected").length, [members]);
  const pendingPasswordCount = useMemo(() => members.filter((m) => m.mustChangePassword).length, [members]);
  const pendingCount = useMemo(() => members.filter((m) => m.accountStatus === "pending").length, [members]);
  const percent = (part: number) => (totalCount ? `${Math.round((part * 100) / totalCount)} %` : "—");

  // Filtrado y ordenamiento de integrantes
  const filteredMembers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();

    const list = members.filter((user) => {
      if (quickTab === "active" && user.accountStatus !== "active") return false;
      if (quickTab === "inactive" && user.accountStatus !== "inactive" && user.accountStatus !== "rejected") return false;
      if (quickTab === "pending-password" && !user.mustChangePassword) return false;
      if (quickTab === "pending" && user.accountStatus !== "pending") return false;
      if (quickTab === "rejected" && user.accountStatus !== "rejected") return false;

      if (roleFilter !== "all" && !user.roles.includes(roleFilter)) return false;

      if (!term) return true;
      const roleNames = user.roles.map((r) => roleLabel(r).toLowerCase()).join(" ");
      const email = user.email?.toLowerCase() ?? "";
      const fullName = user.fullName.toLowerCase();
      const slug = email.split("@")[0] ?? "";
      const doc = user.id.toLowerCase();

      return fullName.includes(term) || email.includes(term) || slug.includes(term) || roleNames.includes(term) || doc.includes(term);
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" });
      } else if (sortField === "email") {
        cmp = (a.email ?? "").localeCompare(b.email ?? "", "es", { sensitivity: "base" });
      } else if (sortField === "status") {
        const order: Record<AccountStatus, number> = { active: 1, pending: 2, inactive: 3, rejected: 4 };
        cmp = (order[a.accountStatus ?? "active"] ?? 99) - (order[b.accountStatus ?? "active"] ?? 99);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [members, quickTab, roleFilter, userSearch, sortField, sortDirection]);

  const hasActiveFilters = quickTab !== "all" || userSearch !== "" || roleFilter !== "all";

  const resetFilters = () => {
    setQuickTab("all");
    setUserSearch("");
    setRoleFilter("all");
  };

  // Copiado al portapapeles con feedback visual
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(label);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // No-op
    }
  };

  // Cargar detalle completo del usuario en el modal
  const loadDetail = useCallback(async (id: string) => {
    currentDetailId.current = id;
    setDetailLoading(true);
    setDetailError(null);
    setActionError(null);
    setActionNotice(null);
    setConfirmDeactivate(false);

    try {
      const data = await apiRequest<MemberDetail>(`/users/${id}`);
      if (currentDetailId.current === id) {
        setMemberDetail(data);
      }
    } catch (caught) {
      if (currentDetailId.current === id) {
        setDetailError(describeError(caught));
      }
    } finally {
      if (currentDetailId.current === id) {
        setDetailLoading(false);
      }
    }
  }, []);

  const openUserDetail = (user: MemberListItem) => {
    setSelectedUser(user);
    setDetailTab("profile");
    setDetailModalOpen(true);
    void loadDetail(user.id);
  };

  const closeUserDetail = () => {
    setDetailModalOpen(false);
    setSelectedUser(null);
    setMemberDetail(null);
    setCredentials(null);
    currentDetailId.current = null;
  };

  // Refrescar todos los integrantes
  const refreshMembers = async () => {
    setLoading(true);
    try {
      if (authority) {
        const [activeRes, inactiveRes, pendingRes, rejectedRes] = await Promise.all([
          apiRequest<{ items: MemberListItem[] }>("/users?status=active&pageSize=100").catch(() => ({ items: [] })),
          apiRequest<{ items: MemberListItem[] }>("/users?status=inactive&pageSize=100").catch(() => ({ items: [] })),
          apiRequest<{ items: MemberListItem[] }>("/users?status=pending&pageSize=100").catch(() => ({ items: [] })),
          apiRequest<{ items: MemberListItem[] }>("/users?status=rejected&pageSize=100").catch(() => ({ items: [] })),
        ]);
        const combined = [...activeRes.items, ...inactiveRes.items, ...pendingRes.items, ...rejectedRes.items];
        const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
        setMembers(unique);
      } else {
        const res = await apiRequest<{ items: MemberListItem[] }>("/users?status=active&pageSize=100");
        setMembers(res.items);
      }
      router.refresh();
    } catch {
      // Ignorar: la lista conserva lo ya cargado
    } finally {
      setLoading(false);
    }
  };

  // Acciones en la ficha
  const executeAdminAction = async <T,>(key: string, action: () => Promise<T>, onSuccess: (result: T) => void) => {
    setBusyAction(key);
    setActionError(null);
    setActionNotice(null);

    try {
      const res = await action();
      onSuccess(res);
      if (selectedUser) {
        void loadDetail(selectedUser.id);
      }
      void refreshMembers();
    } catch (caught) {
      setActionError(describeError(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleStatus = (targetStatus: "active" | "inactive", reason = "") => {
    if (!selectedUser) return;
    void executeAdminAction(
      "status",
      () =>
        apiRequest<{ credentials?: TemporaryCredentials }>(`/users/${selectedUser.id}/status`, {
          method: "PATCH",
          body: {
            status: targetStatus,
            ...(reason ? { reason } : {}),
            ...(selectedUser.roles.length === 0 ? { roleCode: "student" } : {}),
          },
        }),
      (result) => {
        setConfirmDeactivate(false);
        setActionNotice(targetStatus === "active" ? "Cuenta activada exitosamente." : "Cuenta desactivada. Sus sesiones se cerraron.");
        if (result.credentials) {
          setCredentials({
            key: selectedUser.id,
            userId: selectedUser.id,
            fullName: selectedUser.fullName,
            email: selectedUser.email ?? "",
            credentials: result.credentials,
          });
        }
      },
    );
  };

  const handleReissuePassword = () => {
    if (!selectedUser) return;
    void executeAdminAction(
      "reissue",
      () => apiRequest<{ credentials: TemporaryCredentials }>(`/users/${selectedUser.id}/temporary-password`, { method: "POST" }),
      (result) => {
        setActionNotice("Se generó una nueva contraseña temporal para el integrante.");
        setCredentials({
          key: selectedUser.id,
          userId: selectedUser.id,
          fullName: selectedUser.fullName,
          email: selectedUser.email ?? "",
          credentials: result.credentials,
        });
      },
    );
  };

  const isManageable = selectedUser ? canManageMember(actor, selectedUser) : false;
  const selectedStatus: AccountStatus = selectedUser?.accountStatus ?? "active";

  const tabs: { value: QuickFilterTab; label: string; count: number; show: boolean }[] = [
    { value: "all", label: "Todos", count: totalCount, show: true },
    { value: "active", label: "Activos", count: activeCount, show: true },
    { value: "inactive", label: "Inactivos", count: inactiveCount, show: true },
    { value: "pending-password", label: "Clave pendiente", count: pendingPasswordCount, show: true },
    { value: "pending", label: "Pendientes", count: pendingCount, show: canUpdate && pendingCount > 0 },
  ];
  const appliedFilters = [
    quickTab !== "all" && { label: "Estado", value: tabs.find((tab) => tab.value === quickTab)?.label ?? quickTab, clear: () => setQuickTab("all") },
    userSearch !== "" && { label: "Búsqueda", value: userSearch, clear: () => setUserSearch("") },
    roleFilter !== "all" && { label: "Rol", value: roleLabel(roleFilter), clear: () => setRoleFilter("all") },
  ].filter((item): item is { label: string; value: string; clear: () => void } => Boolean(item));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Integrantes</h1>
            <span className={neutralChip}>Directorio institucional</span>
          </div>
          <p className="max-w-3xl text-sm text-hub-muted">Directorio de cuentas, asignación de roles, sesiones y trazabilidad del sistema.</p>
          {canUpdate && (
            <Link href="/hub/solicitudes" className="group inline-flex items-center gap-1 self-start rounded text-xs font-medium text-hub-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
              Solicitudes de acceso pendientes ({statusCounts.pending})
              <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button type="button" onClick={refreshMembers} disabled={loading} className={`${iconAction} border border-hub-border bg-hub-panel text-hub-text hover:bg-hub-hover`}>
            <RefreshCw aria-hidden="true" className={cn("size-4 text-hub-muted", loading && "animate-spin text-hub-accent motion-reduce:animate-none")} />
            Actualizar
          </button>
          {canCreate && (
            <button type="button" onClick={() => setInviteModalOpen(true)} aria-haspopup="dialog" className={primaryButton}>
              <UserPlus aria-hidden="true" className="size-4" />
              Invitar integrante
            </button>
          )}
        </div>
      </header>

      <dl aria-label="Resumen de integrantes" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de cuentas" icon={Users} value={totalCount} hint="Cuentas registradas en el HUB" />
        <KpiCard label="Cuentas activas" icon={UserCheck} value={activeCount} hint={`${percent(activeCount)} del total · acceso habilitado`} />
        <KpiCard label="Inactivas o bajas" icon={UserX} value={inactiveCount} hint={`${percent(inactiveCount)} del total · acceso revocado`} />
        <KpiCard
          label="Clave provisional"
          icon={KeyRound}
          value={pendingPasswordCount}
          hint={pendingPasswordCount ? "Deben cambiar la contraseña inicial" : "Nadie tiene una clave temporal pendiente"}
        />
      </dl>

      <section aria-label="Filtros del directorio" className={cn(panelCard, "flex flex-col gap-3 p-3")}>
        <nav aria-label="Filtrar por estado" className="-mx-1 overflow-x-auto px-1 pb-1">
          <ul className="flex min-w-max items-center gap-1.5 rounded-xl bg-hub-subtle p-1">
            {tabs
              .filter((tab) => tab.show)
              .map((tab) => {
                const current = tab.value === quickTab;
                return (
                  <li key={tab.value}>
                    <button
                      type="button"
                      onClick={() => setQuickTab(tab.value)}
                      aria-pressed={current}
                      className={cn(
                        "flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                        current ? "bg-hub-accent font-semibold text-hub-bg shadow-sm" : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                      )}
                    >
                      {tab.label}
                      <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[11px]", current ? "bg-hub-bg/20" : "bg-hub-border text-hub-muted")}>{tab.count}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </nav>

        <div role="search" className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
          <label className="relative min-w-60 flex-1">
            <span className="sr-only">Buscar integrantes por nombre, correo o rol</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-hub-muted" />
            <input
              ref={searchInputRef}
              type="search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Buscar por nombre, correo institucional o rol… (Ctrl K)"
              className="min-h-10 w-full rounded-lg bg-hub-subtle py-2 pl-10 pr-4 text-sm text-hub-text placeholder:text-hub-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-hub-muted">
              Rol
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleCode | "all")} className={controlClass}>
                <option value="all">Todos los roles</option>
                {ROLE_CODES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-hub-muted">
              Ordenar
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(event) => {
                  const option = SORT_OPTIONS.find((item) => item.value === event.target.value);
                  if (option) {
                    setSortField(option.field);
                    setSortDirection(option.direction);
                  }
                }}
                className={controlClass}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex min-h-7 flex-wrap items-center gap-1.5">
            {hasActiveFilters && (
              <>
                <span className="mr-1 text-xs text-hub-muted">Filtros aplicados:</span>
                {appliedFilters.map((item) => (
                  <span key={item.label} className={`${chip} gap-1 bg-hub-subtle py-1 text-hub-text`}>
                    {item.label}: <strong className="max-w-48 truncate font-semibold">{item.value}</strong>
                    <button type="button" onClick={item.clear} aria-label={`Quitar el filtro de ${item.label.toLowerCase()}`} className="rounded text-hub-muted transition-colors hover:text-hub-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  </span>
                ))}
                <button type="button" onClick={resetFilters} className="ml-1 rounded text-xs font-medium text-hub-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
                  Limpiar filtros ({appliedFilters.length})
                </button>
              </>
            )}
          </div>
          <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-hub-muted">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-hub-accent" />
            {plural(filteredMembers.length, "integrante", "integrantes")}
            {hasActiveFilters ? " con los filtros actuales" : ""}
          </p>
        </div>
      </section>

      <section aria-label="Directorio de integrantes" className={cn(panelCard, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 border-collapse text-left text-[13px]">
            <caption className="sr-only">Integrantes con correo, roles, estado y acceso a su ficha</caption>
            <thead>
              <tr className={cn(eyebrow, "bg-hub-subtle")}>
                <th scope="col" className="px-4 py-3 font-semibold">Integrante</th>
                <th scope="col" className="px-4 py-3 font-semibold">Correo institucional</th>
                <th scope="col" className="px-4 py-3 font-semibold">Roles</th>
                <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hub-border">
              {filteredMembers.map((member) => {
                const isCurrent = member.id === actor.id;
                const status = member.accountStatus ?? "active";

                return (
                  <tr key={member.id} className={cn("group transition-colors hover:bg-hub-hover/60", status !== "active" && "text-hub-muted")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hub-accent-soft text-sm font-bold text-hub-accent">
                          {getInitials(member.fullName)}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-hub-text">{member.fullName}</span>
                            {isCurrent && <span className={neutralChip}>Tú</span>}
                          </p>
                          <p className="truncate font-mono text-[11px] text-hub-muted">@{usernameOf(member)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {member.email ? (
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-mono text-xs text-hub-soft">{member.email}</span>
                          <button
                            type="button"
                            onClick={() => void copyToClipboard(member.email!, `email-${member.id}`)}
                            className="flex size-7 shrink-0 items-center justify-center rounded text-hub-muted transition-colors hover:bg-hub-hover hover:text-hub-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                            aria-label={`Copiar el correo de ${member.fullName}`}
                            title="Copiar correo"
                          >
                            {copiedId === `email-${member.id}` ? <Check aria-hidden="true" className="size-3.5 text-hub-success-text" /> : <Copy aria-hidden="true" className="size-3.5" />}
                          </button>
                          <span aria-live="polite" className="sr-only">{copiedId === `email-${member.id}` ? "Correo copiado" : ""}</span>
                        </span>
                      ) : (
                        <span className="italic text-hub-muted">Sin correo visible</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {member.roles.map((role) => (
                          <span key={role} className={`${roleChip(role)} gap-1 rounded-full px-2.5`}>
                            <Shield aria-hidden="true" className="size-3" />
                            {roleLabel(role)}
                          </span>
                        ))}
                        {member.roles.length === 0 && <span className="italic text-hub-muted">Sin roles</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`${STATUS_TONE[status]} gap-1.5 rounded-full px-2.5 py-1`}>
                          <span aria-hidden="true" className={cn("size-1.5 rounded-full", status === "active" ? "bg-hub-success-text" : "bg-current")} />
                          {STATUS_LABEL[status]}
                        </span>
                        {member.mustChangePassword && (
                          <span className={`${neutralChip} gap-1`}>
                            <KeyRound aria-hidden="true" className="size-3" />
                            Clave temporal
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openUserDetail(member)}
                        aria-haspopup="dialog"
                        className="group/link inline-flex items-center gap-1 rounded text-sm font-semibold text-hub-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                      >
                        Ver ficha<span className="sr-only"> de {member.fullName}</span>
                        <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover/link:translate-x-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-hub-text">No se encontraron integrantes</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-hub-muted">
                      {hasActiveFilters ? "No hay registros que coincidan con los filtros seleccionados." : "Actualmente no hay cuentas registradas en el sistema."}
                    </p>
                    {hasActiveFilters && (
                      <button type="button" onClick={resetFilters} className="mt-3 rounded text-xs font-semibold text-hub-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
                        Limpiar filtros
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-hub-border bg-hub-subtle px-4 py-3 text-xs text-hub-muted">
          <span>
            Mostrando <strong className="text-hub-text">{filteredMembers.length}</strong> de <strong className="text-hub-text">{totalCount}</strong> integrantes
          </span>
          <span className="flex items-center gap-1.5">
            <Info aria-hidden="true" className="size-3.5 text-hub-accent" />
            «Ver ficha» abre los datos de la cuenta{canUpdate ? " y la gestión de roles" : ""}.
          </span>
        </footer>
      </section>

      <Modal
        open={detailModalOpen && selectedUser !== null}
        onClose={closeUserDetail}
        title={selectedUser?.fullName ?? "Integrante"}
        description={selectedUser ? <span className="font-mono">{selectedUser.email ?? "Sin correo visible"}</span> : undefined}
        size="lg"
      >
        {selectedUser && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`${STATUS_TONE[selectedStatus]} gap-1.5 rounded-full px-2.5 py-1`}>
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", selectedStatus === "active" ? "bg-hub-success-text" : "bg-current")} />
                {STATUS_LABEL[selectedStatus]}
              </span>
              {selectedUser.roles.map((role) => (
                <span key={role} className={`${roleChip(role)} gap-1 rounded-full px-2.5`}>
                  <Shield aria-hidden="true" className="size-3" />
                  {roleLabel(role)}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canUpdate && isManageable && (
                <>
                  {selectedStatus === "active" ? (
                    <button type="button" onClick={() => setConfirmDeactivate(true)} disabled={busyAction !== null} className={`${iconAction} bg-hub-danger-bg text-hub-danger-text hover:opacity-80`}>
                      <UserX aria-hidden="true" className="size-4" />
                      Desactivar cuenta
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleToggleStatus("active")} disabled={busyAction !== null} className={`${iconAction} bg-hub-success-bg text-hub-success-text hover:opacity-80`}>
                      <UserCheck aria-hidden="true" className="size-4" />
                      Activar cuenta
                    </button>
                  )}
                  {selectedStatus === "active" && (
                    <button type="button" onClick={handleReissuePassword} disabled={busyAction !== null} className={`${iconAction} bg-hub-subtle text-hub-text hover:bg-hub-hover`}>
                      <KeyRound aria-hidden="true" className="size-4 text-hub-accent" />
                      Reexpedir clave
                    </button>
                  )}
                  <button type="button" onClick={() => setDetailTab("roles")} className={`${iconAction} bg-hub-subtle text-hub-text hover:bg-hub-hover`}>
                    <Shield aria-hidden="true" className="size-4 text-hub-accent" />
                    Gestionar roles
                  </button>
                </>
              )}
              <Link href={`/hub/produccion?integrante=${selectedUser.id}`} className={`${iconAction} bg-hub-subtle text-hub-text hover:bg-hub-hover`}>
                <BookOpen aria-hidden="true" className="size-4 text-hub-accent" />
                Producción académica
                <ExternalLink aria-hidden="true" className="size-3 text-hub-muted" />
              </Link>
            </div>

            <div role="tablist" aria-label="Secciones de la ficha" className="inline-flex items-center gap-1 self-start rounded-lg bg-hub-subtle p-1">
              {(
                [
                  { value: "profile", label: "Datos generales", icon: User },
                  { value: "roles", label: `Roles y permisos (${memberDetail ? memberDetail.roles.length : selectedUser.roles.length})`, icon: Shield },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={detailTab === tab.value}
                  onClick={() => setDetailTab(tab.value)}
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1.5 rounded px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                    detailTab === tab.value ? "bg-hub-panel text-hub-accent shadow-sm" : "text-hub-muted hover:text-hub-text",
                  )}
                >
                  <tab.icon aria-hidden="true" className="size-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
              {detailLoading && (
                <p className="flex items-center gap-2 rounded-lg bg-hub-accent-soft p-3 text-xs font-semibold text-hub-accent" role="status">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                  Cargando datos adicionales del integrante…
                </p>
              )}
              {detailError && <Alert tone="error">{detailError}</Alert>}
              {actionError && <Alert tone="error">{actionError}</Alert>}
              {actionNotice && <Alert tone="success">{actionNotice}</Alert>}
              {credentials && <CredentialsNotice result={credentials} onUpdate={setCredentials} onDismiss={() => setCredentials(null)} />}

              {confirmDeactivate && (
                <div role="group" aria-label="Confirmar desactivación" className="flex flex-col gap-3 rounded-xl bg-hub-danger-bg p-4 text-hub-danger-text">
                  <h3 className="text-xs font-bold uppercase tracking-wider">Confirmar desactivación de cuenta</h3>
                  <p className="text-sm">La persona perderá el acceso de inmediato y todas sus sesiones activas serán cerradas.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleToggleStatus("inactive")} disabled={busyAction !== null} className="min-h-9">
                      {busyAction === "status" ? "Desactivando…" : "Confirmar desactivación"}
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmDeactivate(false)} className="w-auto min-h-9 px-4">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {detailTab === "profile" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <section className={cn(panelCard, "flex flex-col gap-3 p-4")}>
                    <h3 className={cn(eyebrow, "flex items-center gap-2 text-hub-accent")}>
                      <User aria-hidden="true" className="size-4" />
                      Identificación y contacto
                    </h3>
                    <dl className="flex flex-col gap-3">
                      <Field label="Nombre completo" value={selectedUser.fullName} />
                      <Field label="Nombre de usuario" value={`@${usernameOf(selectedUser)}`} mono />
                      <div>
                        <dt className="text-[11px] text-hub-muted">Correo institucional</dt>
                        <dd className="mt-0.5 flex items-center gap-2 font-mono text-sm text-hub-text">
                          {selectedUser.email ? (
                            <>
                              <span className="break-all">{selectedUser.email}</span>
                              <button
                                type="button"
                                onClick={() => void copyToClipboard(selectedUser.email!, "modal-email")}
                                className="flex size-7 shrink-0 items-center justify-center rounded text-hub-muted hover:bg-hub-hover hover:text-hub-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                                aria-label="Copiar correo"
                              >
                                {copiedId === "modal-email" ? <Check aria-hidden="true" className="size-3.5 text-hub-success-text" /> : <Copy aria-hidden="true" className="size-3.5" />}
                              </button>
                            </>
                          ) : (
                            <span className="italic text-hub-muted">Sin correo visible</span>
                          )}
                        </dd>
                      </div>
                      <Field label="Identificador interno" value={selectedUser.id} mono muted />
                      <div>
                        <dt className="text-[11px] text-hub-muted">Verificación de correo</dt>
                        <dd className="mt-0.5 text-sm">
                          {memberDetail?.emailVerified ? (
                            <span className="inline-flex items-center gap-1 font-medium text-hub-success-text">
                              <CircleCheck aria-hidden="true" className="size-4" />
                              Verificado
                            </span>
                          ) : (
                            <span className="text-hub-muted">{memberDetail ? "Sin verificar" : "Consultando…"}</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className={cn(panelCard, "flex flex-col gap-3 p-4")}>
                    <h3 className={cn(eyebrow, "flex items-center gap-2 text-hub-accent")}>
                      <Lock aria-hidden="true" className="size-4" />
                      Seguridad y acceso
                    </h3>
                    <dl className="flex flex-col gap-3">
                      <div>
                        <dt className="text-[11px] text-hub-muted">Estado de la cuenta</dt>
                        <dd className="mt-1">
                          <span className={`${STATUS_TONE[selectedStatus]} gap-1.5 rounded-full px-2.5 py-1`}>{STATUS_LABEL[selectedStatus]}</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-hub-muted">Contraseña provisional</dt>
                        <dd className="mt-0.5 text-sm text-hub-text">
                          {memberDetail?.mustChangePassword ? <span className="font-semibold text-hub-info-text">Debe cambiarla al iniciar sesión</span> : <span className="text-hub-muted">{memberDetail ? "No requerida" : "Consultando…"}</span>}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-hub-muted">Fecha de registro</dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-hub-text">
                          <Calendar aria-hidden="true" className="size-3.5 text-hub-muted" />
                          {memberDetail ? formatDate(memberDetail.createdAt) : "Consultando…"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-hub-muted">Última actualización</dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-hub-text">
                          <Clock aria-hidden="true" className="size-3.5 text-hub-muted" />
                          {memberDetail ? formatDate(memberDetail.updatedAt) : "Consultando…"}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              )}

              {detailTab === "roles" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-hub-muted">Haz clic en un rol para asignarlo o quitarlo de esta cuenta. El servidor aplica el cambio de inmediato.</p>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {roleToggles(
                      memberDetail ?? { roles: selectedUser.roles, accountStatus: selectedUser.accountStatus ?? "active" },
                      actor.roles,
                      !canUpdate ? "No tienes permisos de edición en este módulo." : isManageable ? null : "No tienes permisos para administrar esta cuenta.",
                    ).map(({ role, checked, disabled, reason }) => {
                      const isPending = busyAction === `role-${role}`;

                      return (
                        <li key={role}>
                          <button
                            type="button"
                            aria-pressed={checked}
                            disabled={disabled || busyAction !== null}
                            onClick={() => {
                              void executeAdminAction(
                                `role-${role}`,
                                () =>
                                  !checked
                                    ? apiRequest(`/users/${selectedUser.id}/roles`, { method: "POST", body: { roleCode: role } })
                                    : apiRequest(`/users/${selectedUser.id}/roles/${role}`, { method: "DELETE" }),
                                () => {
                                  setActionNotice(!checked ? `Se asignó el rol ${roleLabel(role)}.` : `Se removió el rol ${roleLabel(role)}.`);
                                },
                              );
                            }}
                            className={cn(
                              "flex h-full w-full flex-col justify-between gap-2 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                              checked ? "border-hub-accent bg-hub-accent-soft" : "border-hub-border bg-hub-panel hover:bg-hub-hover",
                              disabled && "cursor-not-allowed opacity-60 hover:bg-hub-panel",
                            )}
                          >
                            <span className="flex items-center justify-between">
                              <span className={cn(chip, checked ? "bg-hub-accent text-hub-bg" : "bg-hub-badge-bg text-hub-badge-text")}>{checked ? "Asignado" : "Disponible"}</span>
                              <span aria-hidden="true" className={cn("flex size-5 items-center justify-center rounded-full border", checked ? "border-hub-accent bg-hub-accent text-hub-bg" : "border-hub-border text-hub-muted")}>
                                {isPending ? <LoaderCircle className="size-3 animate-spin motion-reduce:animate-none" /> : checked ? <Check className="size-3" /> : <CirclePlus className="size-3" />}
                              </span>
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-hub-text">{roleLabel(role)}</span>
                              <span className="mt-0.5 block text-xs text-hub-muted">{ROLE_DESCRIPTIONS[role]}</span>
                              {reason && <span className="mt-1.5 block text-[11px] font-medium text-hub-info-text">{reason}</span>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-hub-border pt-3">
              <Button variant="ghost" onClick={closeUserDetail} className="w-auto px-4">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {canCreate && (
        <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invitar integrante" size="md">
          <InviteForm actorRoles={actor.roles} onClose={() => setInviteModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-hub-muted">{label}</dt>
      <dd className={cn("mt-0.5 break-all text-sm", mono && "font-mono", muted ? "text-hub-muted" : "font-medium text-hub-text")}>{value}</dd>
    </div>
  );
}
