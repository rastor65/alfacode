import type { RoleCode } from "@/lib/auth/roles";

export type MembershipRequestStatus = "pending" | "approved" | "rejected";

export type StudentCvData = {
  fechaElaboracion?: string;
  apellidos?: string;
  nombres?: string;
  fechaNacimiento?: string;
  nacionalidad?: string;
  documentoIdentidad?: string;
  celular?: string;
  telefonoFijo?: string;
  facultad?: string;
  programa?: string;
  sede?: string;
  semestreActual?: string;
  promedioAcademico?: string;
  experienciaInvestigativa?: string;
  areasEstudio?: string;
  lineasInvestigacion?: string;
  publicaciones?: string;
  practicasPasantias?: string;
};

export type MembershipRequestItem = {
  id: string;
  status: MembershipRequestStatus;
  message: string | null;
  cvData?: StudentCvData | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; emailVerified: boolean };
  approvedRole: RoleCode | null;
  reviewedAt: string | null;
  reviewedBy: { id: string; fullName: string } | null;
  reviewComment: string | null;
};

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };

/** Como se entrego la contrasena temporal (DEC-016). */
export type TemporaryCredentials =
  | { delivery: "email" | "failed"; expiresAt: string }
  | { delivery: "manual"; expiresAt: string; temporaryPassword: string };

export const REQUEST_STATUS_LABELS: Record<MembershipRequestStatus, string> = {
  pending: "Pendientes",
  approved: "Aprobadas",
  rejected: "Rechazadas",
};

export function parseRequestStatus(value: string | string[] | undefined): MembershipRequestStatus {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "approved" || candidate === "rejected" ? candidate : "pending";
}

export function parsePage(value: string | string[] | undefined) {
  const candidate = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(candidate) && candidate > 0 && candidate < 10_000 ? candidate : 1;
}
