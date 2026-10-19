"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Info,
  KeyRound,
  LoaderCircle,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TextAreaField } from "@/components/ui/form-field";
import { type CredentialsResult, CredentialsNotice } from "@/features/membership/components/credentials-notice";
import type { TemporaryCredentials } from "@/features/membership/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { type RoleCode, assignableRoles, canManageMember, roleLabel, ROLE_CODES } from "@/lib/auth/roles";
import type { ResourcePermissions } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/permissions-context";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { roleToggles } from "../role-toggles";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_SINGULAR,
  type AccountStatus,
  type MemberDetail,
  type MemberListItem,
} from "../types";
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function getRoleTagClass(role: RoleCode) {
  switch (role) {
    case "admin":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25";
    case "coordinator":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25";
    case "teacher_leader":
      return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25";
    case "researcher":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25";
    case "student":
      return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25";
    default:
      return "bg-hub-accent/10 text-hub-accent border-hub-accent/20";
  }
}

export function MembersDirectoryClient({
  initialMembers,
  actor,
  authority,
  permissions,
  statusCounts,
}: MembersDirectoryClientProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const contextPermissions = usePermissions("/hub/integrantes");
  const effectivePermissions = permissions ?? contextPermissions.permissions;
  const canCreate = effectivePermissions.canCreate;
  const canUpdate = effectivePermissions.canUpdate;
  const canDelete = effectivePermissions.canDelete;

  // Estados de datos y filtros
  const [members, setMembers] = useState<MemberListItem[]>(initialMembers);
  const [loading, setLoading] = useState(false);
  const [quickTab, setQuickTab] = useState<QuickFilterTab>("all");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleCode | "all">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Feedback de copiado rapido
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados del modal de Ficha Tecnica
  const [selectedUser, setSelectedUser] = useState<MemberListItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("profile");
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Modal de invitar integrante
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Acciones de administracion en el modal
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResult | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const currentDetailId = useRef<string | null>(null);

  // Sincronizar initialMembers cuando cambian las props
  useEffect(() => {
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
  const inactiveCount = useMemo(
    () => members.filter((m) => m.accountStatus === "inactive" || m.accountStatus === "rejected").length,
    [members],
  );
  const pendingPasswordCount = useMemo(() => members.filter((m) => m.mustChangePassword).length, [members]);
  const pendingCount = useMemo(() => members.filter((m) => m.accountStatus === "pending").length, [members]);

  const activePercent = totalCount ? Math.round((activeCount / totalCount) * 100) : 0;
  const inactivePercent = totalCount ? Math.round((inactiveCount / totalCount) * 100) : 0;

  // Filtrado y ordenamiento de integrantes
  const filteredMembers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();

    const list = members.filter((user) => {
      // 1. Filtro por pestana rapida
      if (quickTab === "active" && user.accountStatus !== "active") return false;
      if (quickTab === "inactive" && user.accountStatus !== "inactive" && user.accountStatus !== "rejected") return false;
      if (quickTab === "pending-password" && !user.mustChangePassword) return false;
      if (quickTab === "pending" && user.accountStatus !== "pending") return false;
      if (quickTab === "rejected" && user.accountStatus !== "rejected") return false;

      // 2. Filtro por rol
      if (roleFilter !== "all" && !user.roles.includes(roleFilter)) {
        return false;
      }

      // 3. Filtro de busqueda amplia
      if (!term) return true;
      const roleNames = user.roles.map((r) => roleLabel(r).toLowerCase()).join(" ");
      const email = user.email?.toLowerCase() ?? "";
      const fullName = user.fullName.toLowerCase();
      const slug = email.split("@")[0] ?? "";
      const doc = user.id.toLowerCase();

      return fullName.includes(term) || email.includes(term) || slug.includes(term) || roleNames.includes(term) || doc.includes(term);
    });

    // Ordenamiento
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

  // Alternar ordenamiento de columnas
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const hasActiveFilters = quickTab !== "all" || userSearch !== "" || roleFilter !== "all";

  const resetFilters = () => {
    setQuickTab("all");
    setUserSearch("");
    setRoleFilter("all");
  };

  // Copiado al portapapeles con feedback visual
  const copyToClipboard = async (text: string, e: React.MouseEvent, label: string) => {
    e.stopPropagation();
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
    } catch (err) {
      // Ignorar o registrar error en refresh
    } finally {
      setLoading(false);
    }
  };

  // Acciones en Ficha Tecnica
  const executeAdminAction = async <T,>(
    key: string,
    action: () => Promise<T>,
    onSuccess: (result: T) => void,
  ) => {
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
        setActionNotice(
          targetStatus === "active" ? "Cuenta activada exitosamente." : "Cuenta desactivada. Sus sesiones se cerraron.",
        );
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
      () =>
        apiRequest<{ credentials: TemporaryCredentials }>(`/users/${selectedUser.id}/temporary-password`, {
          method: "POST",
        }),
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

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header (SIEP Executive SaaS Header) */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-hub-accent">
            Gestión de acceso • Semillero
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text sm:text-3xl">Integrantes</h1>
          <p className="mt-1 text-sm text-hub-muted">
            Directorio de cuentas, asignación de roles, sesiones y trazabilidad del sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            onClick={refreshMembers}
            disabled={loading}
            className="h-10 border border-hub-border bg-hub-panel px-3.5 text-xs font-semibold text-hub-text hover:bg-hub-hover"
          >
            <RefreshCw size={15} className={cn("mr-2 text-hub-muted", loading && "animate-spin text-hub-accent")} />
            <span>Actualizar</span>
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              onClick={() => setInviteModalOpen(true)}
              className="h-10 font-semibold shadow-sm hover:opacity-95"
            >
              <UserPlus size={16} className="mr-2" />
              <span>Invitar integrante</span>
            </Button>
          )}
        </div>
      </header>

      {/* 2. Resumen Estadistico Superior (4 Stat Cards Elevadas tipo SIEP) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen de integrantes">
        {/* Card 1: Total Cuentas */}
        <article
          role="button"
          tabIndex={0}
          onClick={() => setQuickTab("all")}
          onKeyDown={(e) => e.key === "Enter" && setQuickTab("all")}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-hub-panel p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
            quickTab === "all" ? "border-hub-accent ring-1 ring-hub-accent/40" : "border-hub-panel-border hover:border-hub-accent/50",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-hub-muted">Total Cuentas</span>
            <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-hub-accent transition-transform group-hover:scale-110">
              <Users size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-hub-text">{totalCount}</p>
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-hub-accent">
              100%
            </span>
          </div>
          <p className="mt-1 text-xs text-hub-muted">Cuentas registradas en el HUB</p>
        </article>

        {/* Card 2: Activos */}
        <article
          role="button"
          tabIndex={0}
          onClick={() => setQuickTab("active")}
          onKeyDown={(e) => e.key === "Enter" && setQuickTab("active")}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-hub-panel p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
            quickTab === "active" ? "border-emerald-500 ring-1 ring-emerald-500/40" : "border-hub-panel-border hover:border-emerald-500/50",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-hub-muted">Cuentas Activas</span>
            <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110">
              <UserCheck size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-hub-text">{activeCount}</p>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {activePercent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-hub-muted">Acceso habilitado al sistema</p>
        </article>

        {/* Card 3: Inactivos */}
        <article
          role="button"
          tabIndex={0}
          onClick={() => setQuickTab("inactive")}
          onKeyDown={(e) => e.key === "Enter" && setQuickTab("inactive")}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-hub-panel p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
            quickTab === "inactive" ? "border-amber-500 ring-1 ring-amber-500/40" : "border-hub-panel-border hover:border-amber-500/50",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-hub-muted">Inactivos / Bajas</span>
            <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400 transition-transform group-hover:scale-110">
              <UserX size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-hub-text">{inactiveCount}</p>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              {inactivePercent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-hub-muted">Cuentas suspendidas o dadas de baja</p>
        </article>

        {/* Card 4: Clave Pendiente */}
        <article
          role="button"
          tabIndex={0}
          onClick={() => setQuickTab("pending-password")}
          onKeyDown={(e) => e.key === "Enter" && setQuickTab("pending-password")}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-hub-panel p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
            quickTab === "pending-password" ? "border-sky-500 ring-1 ring-sky-500/40" : "border-hub-panel-border hover:border-sky-500/50",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-hub-muted">Clave Pendiente</span>
            <span className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400 transition-transform group-hover:scale-110">
              <KeyRound size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-hub-text">{pendingPasswordCount}</p>
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400">
              Temporal
            </span>
          </div>
          <p className="mt-1 text-xs text-hub-muted">Deben cambiar contraseña inicial</p>
        </article>
      </section>

      {/* 3. Tarjeta Principal: Directorio y Tabla (users-directory-card) */}
      <article className="flex flex-col overflow-hidden rounded-2xl border border-hub-panel-border bg-hub-panel shadow-sm">
        {/* Barra superior con Titulo y Filtros Rapidos Segmentados */}
        <header className="flex flex-col gap-4 border-b border-hub-border p-4 sm:p-6 bg-hub-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-hub-text">Directorio de integrantes</h2>
              <span className="inline-flex items-center rounded-full border border-hub-accent/25 bg-hub-accent/10 px-2.5 py-0.5 text-xs font-bold text-hub-accent">
                {filteredMembers.length} {filteredMembers.length === 1 ? "cuenta" : "cuentas"}
              </span>
            </div>

            {/* Pestanas rapidas segmentadas SaaS (Todos, Activos, Inactivos, etc.) */}
            <nav className="inline-flex items-center gap-1 rounded-xl border border-hub-border bg-hub-subtle/80 p-1 dark:bg-slate-900/60 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setQuickTab("all")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  quickTab === "all"
                    ? "bg-white text-hub-accent shadow-xs dark:bg-hub-chrome dark:text-white"
                    : "text-hub-muted hover:text-hub-text hover:bg-hub-hover",
                )}
              >
                <span>Todos</span>
                <span className="rounded-full bg-hub-subtle px-1.5 py-0.2 text-[10px] font-bold text-hub-muted">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickTab("active")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  quickTab === "active"
                    ? "bg-white text-emerald-600 shadow-xs dark:bg-hub-chrome dark:text-emerald-400"
                    : "text-hub-muted hover:text-hub-text hover:bg-hub-hover",
                )}
              >
                <span className="size-1.5 rounded-full bg-emerald-500 status-dot-pulse" />
                <span>Activos</span>
                <span className="rounded-full bg-hub-subtle px-1.5 py-0.2 text-[10px] font-bold text-hub-muted">
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickTab("inactive")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  quickTab === "inactive"
                    ? "bg-white text-amber-600 shadow-xs dark:bg-hub-chrome dark:text-amber-400"
                    : "text-hub-muted hover:text-hub-text hover:bg-hub-hover",
                )}
              >
                <span className="size-1.5 rounded-full bg-slate-400" />
                <span>Inactivos</span>
                <span className="rounded-full bg-hub-subtle px-1.5 py-0.2 text-[10px] font-bold text-hub-muted">
                  {inactiveCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickTab("pending-password")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  quickTab === "pending-password"
                    ? "bg-white text-sky-600 shadow-xs dark:bg-hub-chrome dark:text-sky-400"
                    : "text-hub-muted hover:text-hub-text hover:bg-hub-hover",
                )}
              >
                <KeyRound size={12} />
                <span>Clave pendiente</span>
                <span className="rounded-full bg-hub-subtle px-1.5 py-0.2 text-[10px] font-bold text-hub-muted">
                  {pendingPasswordCount}
                </span>
              </button>

              {canUpdate && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setQuickTab("pending")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                    quickTab === "pending"
                      ? "bg-white text-amber-600 shadow-xs dark:bg-hub-chrome dark:text-amber-400"
                      : "text-hub-muted hover:text-hub-text hover:bg-hub-hover",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span>Pendientes</span>
                  <span className="rounded-full bg-hub-subtle px-1.5 py-0.2 text-[10px] font-bold text-hub-muted">
                    {pendingCount}
                  </span>
                </button>
              )}
            </nav>
          </div>

          {/* Buscador principal y selector de rol */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Buscador amplio con icono y shortcut Ctrl+K */}
            <div className="relative flex flex-1 min-w-[280px] sm:min-w-[340px] items-center">
              <span className="pointer-events-none absolute left-3 text-hub-muted" aria-hidden="true">
                <Search size={16} />
              </span>
              <input
                ref={searchInputRef}
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nombre, correo, usuario, documento, rol..."
                aria-label="Buscar integrantes en el directorio"
                className="h-10 w-full rounded-xl border border-hub-border bg-hub-subtle/60 pl-9 pr-16 text-xs text-hub-text placeholder:text-hub-muted focus:border-hub-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-hub-accent/20 dark:focus:bg-hub-chrome transition-all"
              />
              {userSearch ? (
                <button
                  type="button"
                  onClick={() => setUserSearch("")}
                  className="absolute right-3 rounded-full p-1 text-hub-muted hover:bg-hub-hover hover:text-hub-text"
                  aria-label="Borrar búsqueda"
                >
                  <X size={14} />
                </button>
              ) : (
                <span
                  className="pointer-events-none absolute right-3 rounded-md border border-hub-border bg-hub-panel px-1.5 py-0.5 text-[10px] font-bold text-hub-muted"
                  aria-hidden="true"
                >
                  Ctrl K
                </span>
              )}
            </div>

            {/* Filtro desplegable por Rol */}
            <div className="min-w-[170px]">
              <select
                aria-label="Filtrar por rol asignado"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleCode | "all")}
                className="h-10 w-full rounded-xl border border-hub-border bg-hub-subtle/60 px-3 text-xs font-medium text-hub-text focus:border-hub-accent focus:outline-none focus:ring-2 focus:ring-hub-accent/20"
              >
                <option value="all">Todos los roles</option>
                {ROLE_CODES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="h-10 px-3 text-xs font-semibold text-hub-accent hover:bg-hub-hover"
                title="Restablecer todos los filtros"
              >
                <RefreshCw size={14} className="mr-1.5" />
                <span>Restablecer</span>
              </Button>
            )}
          </div>
        </header>

        {/* Tabla estilizada de usuarios con columnas ordenables (users-data-table) */}
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse" aria-label="Directorio de integrantes">
            <thead>
              <tr className="border-b border-hub-border bg-hub-subtle/40 text-[11px] font-bold uppercase tracking-wider text-hub-muted select-none">
                <th
                  scope="col"
                  onClick={() => toggleSort("name")}
                  className="py-3 px-4 sm:px-6 cursor-pointer hover:bg-hub-hover hover:text-hub-text transition-colors"
                  title="Ordenar por Nombre"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>Usuario</span>
                    <span className={cn("opacity-40 transition-opacity", sortField === "name" && "opacity-100 text-hub-accent")}>
                      {sortField === "name" && sortDirection === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </span>
                  </div>
                </th>

                <th
                  scope="col"
                  onClick={() => toggleSort("email")}
                  className="py-3 px-4 cursor-pointer hover:bg-hub-hover hover:text-hub-text transition-colors"
                  title="Ordenar por Correo"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>Contacto</span>
                    <span className={cn("opacity-40 transition-opacity", sortField === "email" && "opacity-100 text-hub-accent")}>
                      {sortField === "email" && sortDirection === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </span>
                  </div>
                </th>

                <th scope="col" className="py-3 px-4">
                  Identificación
                </th>

                <th scope="col" className="py-3 px-4">
                  Roles
                </th>

                <th
                  scope="col"
                  onClick={() => toggleSort("status")}
                  className="py-3 px-4 cursor-pointer hover:bg-hub-hover hover:text-hub-text transition-colors"
                  title="Ordenar por Estado"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>Estado</span>
                    <span className={cn("opacity-40 transition-opacity", sortField === "status" && "opacity-100 text-hub-accent")}>
                      {sortField === "status" && sortDirection === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </span>
                  </div>
                </th>

                <th scope="col" className="py-3 px-4 sm:px-6 text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-hub-border text-xs">
              {filteredMembers.map((member) => {
                const slug = member.email ? member.email.split("@")[0] : member.fullName.toLowerCase().replace(/\s+/g, ".");
                const isCurrent = member.id === actor.id;
                const status = member.accountStatus ?? "active";

                return (
                  <tr
                    key={member.id}
                    onClick={() => openUserDetail(member)}
                    className="group relative cursor-pointer hover:bg-cyan-500/[0.04] dark:hover:bg-cyan-500/[0.08] transition-colors"
                    title={`Click para abrir la ficha técnica de ${member.fullName}`}
                  >
                    {/* 1. Columna Usuario: Avatar oficial + Nombre + @usuario */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 via-cyan-700 to-sky-800 text-sm font-bold text-white shadow-sm ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
                          {getInitials(member.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-hub-text group-hover:text-hub-accent transition-colors">
                            {member.fullName}
                          </p>
                          <p className="truncate font-mono text-[11px] text-hub-muted">@{slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* 2. Columna Contacto: Email con icono y copiado */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        {member.email ? (
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(member.email!, e, `email-${member.id}`)}
                            className="inline-flex items-center gap-1.5 text-xs text-hub-text hover:text-hub-accent hover:underline text-left group/copy"
                            title={`Click para copiar correo: ${member.email}`}
                          >
                            <Mail size={13} className="text-hub-muted shrink-0 group-hover/copy:text-hub-accent" />
                            <span className="truncate">{member.email}</span>
                            {copiedId === `email-${member.id}` ? (
                              <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Copiado!
                              </span>
                            ) : null}
                          </button>
                        ) : (
                          <span className="text-hub-muted italic">Sin correo registrado</span>
                        )}

                        {isCurrent && (
                          <span className="inline-flex w-fit items-center rounded-md bg-hub-accent/10 px-1.5 py-0.2 text-[10px] font-bold text-hub-accent">
                            (tú)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Columna Identificacion */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-hub-border bg-hub-subtle/50 px-2 py-1 text-[11px] font-mono text-hub-text">
                        <span className="font-bold text-hub-accent">DOC</span>
                        <span>{member.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </td>

                    {/* 4. Columna Roles: Badges con estilo tematico */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {member.roles.map((role) => (
                          <span
                            key={role}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              getRoleTagClass(role),
                            )}
                          >
                            <Shield size={10} />
                            <span>{roleLabel(role)}</span>
                          </span>
                        ))}
                        {member.mustChangePassword && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                            <KeyRound size={10} />
                            <span>Clave temporal</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Columna Estado: Punto animado con microinteraccion */}
                    <td className="py-3.5 px-4">
                      {status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500 status-dot-pulse" />
                          <span>Activo</span>
                        </span>
                      ) : status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          <span>Pendiente</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/25 bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span className="size-1.5 rounded-full bg-slate-400" />
                          <span>Inactivo</span>
                        </span>
                      )}
                    </td>

                    {/* 6. Columna Acciones: Boton 'Ficha' con chevron */}
                    <td className="py-3.5 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openUserDetail(member)}
                          className="inline-flex items-center gap-1 rounded-lg border border-hub-border bg-hub-panel px-2.5 py-1.5 text-xs font-semibold text-hub-text hover:border-hub-accent hover:text-hub-accent transition-all shadow-2xs"
                          title={`Ver ficha técnica de ${member.fullName}`}
                        >
                          <User size={12} />
                          <span>Ficha</span>
                          <ChevronRight size={12} className="text-hub-muted" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-full bg-hub-subtle text-hub-muted">
                        <Search size={22} />
                      </div>
                      <h3 className="text-sm font-bold text-hub-text">No se encontraron integrantes</h3>
                      <p className="text-xs text-hub-muted max-w-sm">
                        {hasActiveFilters
                          ? "No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados."
                          : "Actualmente no hay usuarios registrados en el sistema."}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="ghost" onClick={resetFilters} className="mt-2 text-xs font-semibold text-hub-accent">
                          <RefreshCw size={14} className="mr-1.5" />
                          <span>Restablecer filtros</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie del Directorio: Resumen y metadatos */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hub-border bg-hub-subtle/50 px-4 py-3 sm:px-6 text-xs">
          <span className="text-hub-muted">
            Mostrando <strong className="text-hub-text">{filteredMembers.length}</strong> de{" "}
            <strong className="text-hub-text">{totalCount}</strong> integrantes en el semillero
          </span>
          <div className="flex items-center gap-1.5 text-hub-muted">
            <Info size={13} className="text-hub-accent" />
            <span>Haz clic en cualquier fila para abrir la ficha técnica del integrante en un modal.</span>
          </div>
        </footer>
      </article>

      {/* ========================================================================= */}
      {/* MODAL DE FICHA TECNICA (EXACTO A SIEP, CON COLORES DE ALFACODE)           */}
      {/* ========================================================================= */}
      {detailModalOpen && selectedUser && (
        <div
          role="presentation"
          onClick={closeUserDetail}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-hub-border bg-hub-panel shadow-2xl"
          >
            {/* Encabezado con Degradado de AlfaCode y Ambient Glow */}
            <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-900 p-5 text-white overflow-hidden shadow-sm">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 85% 15%, rgba(103, 232, 249, 0.25), transparent 45%), radial-gradient(circle at 15% 85%, rgba(14, 116, 144, 0.35), transparent 50%)",
                }}
                aria-hidden="true"
              />

              <div className="relative z-1 flex items-center gap-3.5 min-w-0">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-lg font-bold text-white shadow-md backdrop-blur-md">
                  {getInitials(selectedUser.fullName)}
                </div>

                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="user-detail-title" className="text-lg font-bold text-white tracking-tight">
                      {selectedUser.fullName}
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-white",
                        selectedUser.accountStatus === "active"
                          ? "border-emerald-500/50 bg-emerald-500/25"
                          : "border-slate-500/50 bg-slate-500/25",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          selectedUser.accountStatus === "active" ? "bg-emerald-400 status-dot-pulse" : "bg-slate-400",
                        )}
                      />
                      <span>{selectedUser.accountStatus === "active" ? "Activo" : "Inactivo"}</span>
                    </span>
                    {selectedUser.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white"
                      >
                        <Shield size={9} />
                        <span>{roleLabel(role)}</span>
                      </span>
                    ))}
                  </div>

                  <p className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                    <span className="font-mono">
                      @{selectedUser.email ? selectedUser.email.split("@")[0] : "integrante"}
                    </span>
                    <span>•</span>
                    <span>{selectedUser.email ?? "Sin correo"}</span>
                    <span>•</span>
                    <span>Integrante del semillero</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeUserDetail}
                className="relative z-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/25 hover:text-white"
                aria-label="Cerrar ficha técnica"
              >
                <X size={16} />
              </button>
            </header>

            {/* Barra de Acciones Rapidas dentro del Modal */}
            <div className="flex flex-wrap items-center gap-2.5 border-b border-hub-border bg-hub-subtle/50 px-5 py-2.5">
              {canUpdate && isManageable && (
                <>
                  {selectedUser.accountStatus === "active" ? (
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDeactivate(true)}
                      disabled={busyAction !== null}
                      className="h-8 border border-rose-500/20 bg-rose-500/10 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                    >
                      <UserX size={13} className="mr-1.5" />
                      <span>Desactivar cuenta</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => handleToggleStatus("active")}
                      disabled={busyAction !== null}
                      className="h-8 border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <UserCheck size={13} className="mr-1.5" />
                      <span>Activar cuenta</span>
                    </Button>
                  )}

                  {selectedUser.accountStatus === "active" && (
                    <Button
                      variant="ghost"
                      onClick={handleReissuePassword}
                      disabled={busyAction !== null}
                      className="h-8 border border-hub-border bg-hub-panel px-3 text-xs font-semibold text-hub-text hover:bg-hub-hover"
                    >
                      <KeyRound size={13} className="mr-1.5 text-hub-accent" />
                      <span>Reexpedir clave</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setDetailTab("roles")}
                    className="h-8 border border-hub-border bg-hub-panel px-3 text-xs font-semibold text-hub-text hover:bg-hub-hover"
                  >
                    <Shield size={13} className="mr-1.5 text-hub-accent" />
                    <span>Gestionar roles</span>
                  </Button>
                </>
              )}

              <Link
                href={`/hub/produccion?integrante=${selectedUser.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hub-border bg-hub-panel px-3 text-xs font-semibold text-hub-text hover:bg-hub-hover transition-colors"
              >
                <BookOpen size={13} className="text-hub-accent" />
                <span>Producción académica</span>
                <ExternalLink size={11} className="text-hub-muted" />
              </Link>
            </div>

            {/* Pestanas internas de navegacion del modal */}
            <div className="flex border-b border-hub-border bg-hub-panel px-5 pt-3">
              <nav className="flex gap-2" aria-label="Secciones de la ficha">
                <button
                  type="button"
                  onClick={() => setDetailTab("profile")}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all",
                    detailTab === "profile"
                      ? "border-hub-accent text-hub-accent"
                      : "border-transparent text-hub-muted hover:text-hub-text",
                  )}
                >
                  <User size={14} />
                  <span>Datos Generales</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("roles")}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all",
                    detailTab === "roles"
                      ? "border-hub-accent text-hub-accent"
                      : "border-transparent text-hub-muted hover:text-hub-text",
                  )}
                >
                  <Shield size={14} />
                  <span>Roles y Permisos</span>
                  <span className="rounded-full bg-hub-subtle px-1.5 py-0.2 text-[10px] font-bold text-hub-muted">
                    {memberDetail ? memberDetail.roles.length : selectedUser.roles.length}
                  </span>
                </button>
              </nav>
            </div>

            {/* Cuerpo del Modal */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {detailLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-hub-accent/20 bg-hub-accent/10 p-3 text-xs font-semibold text-hub-accent">
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>Cargando datos adicionales del integrante…</span>
                </div>
              )}

              {actionError && <Alert tone="error">{actionError}</Alert>}
              {actionNotice && <Alert tone="success">{actionNotice}</Alert>}
              {credentials && (
                <CredentialsNotice result={credentials} onUpdate={setCredentials} onDismiss={() => setCredentials(null)} />
              )}

              {confirmDeactivate && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
                  <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Confirmar desactivación de cuenta
                  </h3>
                  <p className="text-xs text-hub-muted">
                    La persona perderá el acceso de inmediato y todas sus sesiones activas serán cerradas.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleToggleStatus("inactive")}
                      disabled={busyAction !== null}
                      className="h-8 bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      {busyAction === "status" ? "Desactivando…" : "Confirmar desactivación"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDeactivate(false)}
                      className="h-8 text-xs font-semibold text-hub-muted hover:text-hub-text"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Pestana 1: Datos Generales */}
              {detailTab === "profile" && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Bloque Identificacion y Contacto */}
                  <section className="flex flex-col gap-3 rounded-xl border border-hub-border bg-hub-subtle/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-hub-accent">
                      <User size={15} />
                      <span>Identificación y contacto</span>
                    </div>

                    <dl className="grid grid-cols-1 gap-3 text-xs">
                      <div>
                        <dt className="text-hub-muted font-medium">Nombre completo</dt>
                        <dd className="mt-0.5 font-semibold text-hub-text">{selectedUser.fullName}</dd>
                      </div>
                      <div>
                        <dt className="text-hub-muted font-medium">Nombre de usuario</dt>
                        <dd className="mt-0.5 font-mono text-hub-text">
                          @{selectedUser.email ? selectedUser.email.split("@")[0] : "integrante"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-hub-muted font-medium">Correo institucional</dt>
                        <dd className="mt-0.5 font-mono text-hub-text">
                          {selectedUser.email ? (
                            <span className="flex items-center gap-2">
                              <span>{selectedUser.email}</span>
                              <button
                                type="button"
                                onClick={(e) => copyToClipboard(selectedUser.email!, e, "modal-email")}
                                className="text-hub-muted hover:text-hub-accent"
                                title="Copiar correo"
                              >
                                {copiedId === "modal-email" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </span>
                          ) : (
                            <span className="italic text-hub-muted">Sin correo</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-hub-muted font-medium">Identificador interno</dt>
                        <dd className="mt-0.5 font-mono text-hub-muted">{selectedUser.id}</dd>
                      </div>
                      <div>
                        <dt className="text-hub-muted font-medium">Verificación de correo</dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 text-hub-text">
                          {memberDetail?.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 size={13} />
                              <span>Verificado</span>
                            </span>
                          ) : (
                            <span className="text-hub-muted">Sin verificar</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {/* Bloque Seguridad y Acceso */}
                  <section className="flex flex-col gap-3 rounded-xl border border-hub-border bg-hub-subtle/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-hub-accent">
                      <Lock size={15} />
                      <span>Seguridad y acceso</span>
                    </div>

                    <dl className="grid grid-cols-1 gap-3 text-xs">
                      <div>
                        <dt className="text-hub-muted font-medium">Estado de la cuenta</dt>
                        <dd className="mt-0.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              selectedUser.accountStatus === "active"
                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-slate-500/25 bg-slate-500/10 text-slate-500 dark:text-slate-400",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                selectedUser.accountStatus === "active" ? "bg-emerald-500 status-dot-pulse" : "bg-slate-400",
                              )}
                            />
                            <span>{ACCOUNT_STATUS_SINGULAR[selectedUser.accountStatus ?? "active"]}</span>
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-hub-muted font-medium">Contraseña provisional</dt>
                        <dd className="mt-0.5 text-hub-text">
                          {memberDetail?.mustChangePassword ? (
                            <span className="font-semibold text-sky-600 dark:text-sky-400">
                              Debe cambiar contraseña al iniciar sesión
                            </span>
                          ) : (
                            <span className="text-hub-muted">No requerida</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-hub-muted font-medium">Fecha de registro</dt>
                        <dd className="mt-0.5 flex items-center gap-1 text-hub-text">
                          <Calendar size={13} className="text-hub-muted" />
                          <span>{memberDetail ? formatDate(memberDetail.createdAt) : "Consultando…"}</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-hub-muted font-medium">Última actualización</dt>
                        <dd className="mt-0.5 flex items-center gap-1 text-hub-text">
                          <Clock size={13} className="text-hub-muted" />
                          <span>{memberDetail ? formatDate(memberDetail.updatedAt) : "Consultando…"}</span>
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              )}

              {/* Pestana 2: Roles Asignados (Cards Interactivas) */}
              {detailTab === "roles" && (
                <div className="space-y-4">
                  <p className="text-xs text-hub-muted">
                    Haz clic en cualquier rol para asignarlo o removerlo de esta cuenta inmediatamente. Los cambios se sincronizan en tiempo real con el servidor.
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {roleToggles(
                      memberDetail ?? { roles: selectedUser.roles, accountStatus: selectedUser.accountStatus ?? "active" },
                      actor.roles,
                      !canUpdate
                        ? "No tienes permisos de edición en este módulo."
                        : isManageable
                          ? null
                          : "No tienes permisos para administrar esta cuenta.",
                    ).map(({ role, checked, disabled, reason }) => {
                      const isPending = busyAction === `role-${role}`;

                      return (
                        <button
                          key={role}
                          type="button"
                          disabled={disabled || busyAction !== null}
                          onClick={() => {
                            void executeAdminAction(
                              `role-${role}`,
                              () =>
                                !checked
                                  ? apiRequest(`/users/${selectedUser.id}/roles`, {
                                      method: "POST",
                                      body: { roleCode: role },
                                    })
                                  : apiRequest(`/users/${selectedUser.id}/roles/${role}`, {
                                      method: "DELETE",
                                    }),
                              () => {
                                setActionNotice(
                                  !checked
                                    ? `Se asignó el rol ${roleLabel(role)}.`
                                    : `Se removió el rol ${roleLabel(role)}.`,
                                );
                              },
                            );
                          }}
                          className={cn(
                            "relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-150",
                            checked
                              ? "border-hub-accent/40 bg-hub-accent/5 ring-1 ring-hub-accent/25"
                              : "border-hub-border bg-hub-panel hover:bg-hub-subtle/50",
                            disabled && "opacity-60 cursor-not-allowed hover:bg-hub-panel",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                                checked
                                  ? "border-hub-accent/30 bg-hub-accent/15 text-hub-accent"
                                  : "border-hub-border bg-hub-subtle text-hub-muted",
                              )}
                            >
                              {checked ? "Asignado" : "Disponible"}
                            </span>

                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full border transition-colors",
                                checked
                                  ? "border-hub-accent bg-hub-accent text-hub-chrome"
                                  : "border-hub-border bg-hub-subtle text-hub-muted",
                              )}
                            >
                              {isPending ? (
                                <LoaderCircle size={11} className="animate-spin" />
                              ) : checked ? (
                                <Check size={11} />
                              ) : (
                                <Plus size={11} />
                              )}
                            </span>
                          </div>

                          <div className="mt-2.5">
                            <h4 className="text-xs font-bold text-hub-text">{roleLabel(role)}</h4>
                            <p className="mt-0.5 text-[11px] text-hub-muted">
                              {role === "admin" && "Control y administración total de la plataforma."}
                              {role === "coordinator" && "Gestión de proyectos, solicitudes y miembros."}
                              {role === "teacher_leader" && "Supervisión docente de actividades de investigación."}
                              {role === "researcher" && "Publicación y desarrollo de líneas de investigación."}
                              {role === "student" && "Participación activa en proyectos y semillero."}
                            </p>
                            {reason && <p className="mt-1.5 text-[10px] text-amber-500 font-medium">{reason}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <footer className="flex items-center justify-end gap-3 border-t border-hub-border bg-hub-subtle/40 px-5 py-3.5">
              <Button
                variant="ghost"
                onClick={closeUserDetail}
                className="h-9 px-4 text-xs font-semibold text-hub-text hover:bg-hub-hover"
              >
                Cerrar
              </Button>
            </footer>
          </section>
        </div>
      )}

      {/* Modal de Invitar Integrante */}
      {canCreate && (
        <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invitar integrante" size="md">
          <InviteForm actorRoles={actor.roles} onClose={() => setInviteModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
