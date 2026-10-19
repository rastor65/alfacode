import type { DocumentItem, UploadLimits } from "@/features/documents/types";
export const REQUEST_TYPES = { certificate: "Certificado", data_change: "Cambio de información", withdrawal: "Desvinculación", responsibility_change: "Cambio de responsabilidad", general: "Solicitud general" } as const;
export const REQUEST_STATUSES = { pending: "Pendiente", in_review: "En revisión", approved: "Aprobada", rejected: "Rechazada", completed: "Completada" } as const;
export type RequestStatus = keyof typeof REQUEST_STATUSES;
export type Person = { id: string; fullName: string };
export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };
export type RequestItem = {
  id: string; requesterId: string; type: keyof typeof REQUEST_TYPES; subject: string; description: string; status: RequestStatus;
  reviewerId: string | null; requester: Person; reviewer: Person | null; response: string | null;
  decisionBy: Person | null; executionBy: Person | null; reviewedAt: string | null; completedAt: string | null; createdAt: string;
  permissions: { canAssign: boolean; canAttach: boolean; canWithdraw: boolean; allowedTransitions: RequestStatus[] };
};
export type RequestList = Page<RequestItem> & { permissions: { canReview: boolean } };
export type HistoryItem = { id: string; action: string; actor: Person | null; createdAt: string; details: { from?: string; to?: string; response?: string; title?: string } | null };
export type AttachmentList = Page<DocumentItem> & { upload: UploadLimits };
export type Blocker = { kind: "project" | "task" | "event" | "request"; id: string; label: string; href: string };
export const BLOCKER_LABELS = { project: "Liderazgo de proyecto", task: "Tarea abierta", event: "Organización de actividad", request: "Revisión de solicitud" };
export const HISTORY_LABELS: Record<string, string> = {
  "administrative_request.created": "Solicitud registrada", "administrative_request.reviewer_assigned": "Responsable asignado",
  "administrative_request.status_changed": "Estado actualizado", "administrative_request.document_added": "Adjunto incorporado",
  "administrative_request.document_removed": "Adjunto eliminado", "administrative_request.withdrawal_executed": "Desvinculación ejecutada",
};
export function knownKey<T extends Record<string, unknown>>(values: T, input: string | string[] | undefined): keyof T | undefined {
  const key = Array.isArray(input) ? input[0] : input;
  return key && Object.hasOwn(values, key) ? key : undefined;
}
