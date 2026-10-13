import { ROLE_CODES, type RoleCode } from "@/lib/auth/roles";

export type AccountStatus = "active" | "inactive" | "pending" | "rejected";

/** Lo que cualquier integrante ve de los demas (matriz F1: datos no sensibles). */
export type MemberSummary = { id: string; fullName: string; roles: RoleCode[] };

/** Vista de administracion (solo admin y coordinator). */
export type MemberDetail = MemberSummary & {
  email: string;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemberListItem = MemberSummary & Partial<Omit<MemberDetail, keyof MemberSummary>>;

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Activos",
  inactive: "Inactivos",
  pending: "Pendientes",
  rejected: "Rechazados",
};

export const ACCOUNT_STATUS_SINGULAR: Record<AccountStatus, string> = {
  active: "Activa",
  inactive: "Inactiva",
  pending: "Pendiente",
  rejected: "Rechazada",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAccountStatus(value: string | string[] | undefined): AccountStatus {
  const candidate = first(value);
  return candidate === "inactive" || candidate === "pending" || candidate === "rejected" ? candidate : "active";
}

export function parseRole(value: string | string[] | undefined): RoleCode | undefined {
  const candidate = first(value);
  return ROLE_CODES.includes(candidate as RoleCode) ? (candidate as RoleCode) : undefined;
}

/** Busqueda: texto recortado de hasta 100 caracteres (limite del backend). */
export function parseSearch(value: string | string[] | undefined) {
  const candidate = first(value)?.trim() ?? "";
  return candidate.slice(0, 100);
}
