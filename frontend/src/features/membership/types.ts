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

/** Iniciales (hasta dos) para el avatar de una persona. */
export function initialsOf(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/** Cifras de las solicitudes de una pagina: con Hoja de Vida, correo verificado, la mas antigua y la ultima revision. */
export function requestStats(items: readonly Pick<MembershipRequestItem, "cvData" | "user" | "createdAt" | "reviewedAt" | "reviewedBy">[]) {
  let withCv = 0;
  let verified = 0;
  let oldest: string | null = null;
  let latestReview: { at: string; by: string | null } | null = null;

  for (const item of items) {
    if (item.cvData) withCv += 1;
    if (item.user.emailVerified) verified += 1;
    if (!oldest || item.createdAt < oldest) oldest = item.createdAt;
    if (item.reviewedAt && (!latestReview || item.reviewedAt > latestReview.at)) latestReview = { at: item.reviewedAt, by: item.reviewedBy?.fullName ?? null };
  }

  return { withCv, verified, oldest, latestReview };
}
