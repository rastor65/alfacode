"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { RoleSelect } from "@/features/members/components/role-select";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { type RoleCode, assignableRoles, roleLabel } from "@/lib/auth/roles";

import type { MembershipRequestItem, TemporaryCredentials } from "../types";
import { type CredentialsResult, CredentialsNotice } from "./credentials-notice";

type Mode = "idle" | "approve" | "reject";

function RequestCard({
  request,
  actorRoles,
  createdLabel,
  reviewedLabel,
  onApproved,
}: {
  request: MembershipRequestItem;
  actorRoles: RoleCode[];
  createdLabel: string;
  reviewedLabel: string | null;
  onApproved: (result: CredentialsResult) => void;
}) {
  const router = useRouter();
  const roleSelectId = useId();
  const [mode, setMode] = useState<Mode>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roles = assignableRoles(actorRoles);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const comment = String(form.get("comment") ?? "").trim();

    setPending(true);
    setError(null);

    try {
      if (mode === "approve") {
        const roleCode = String(form.get("roleCode") ?? "student");
        const response = await apiRequest<{ credentials: TemporaryCredentials }>(
          `/membership-requests/${request.id}/approve`,
          { method: "POST", body: { roleCode, ...(comment ? { comment } : {}) } },
        );
        onApproved({
          key: request.id,
          userId: request.user.id,
          fullName: request.user.fullName,
          email: request.user.email,
          credentials: response.credentials,
        });
      } else {
        await apiRequest(`/membership-requests/${request.id}/reject`, {
          method: "POST",
          body: comment ? { comment } : {},
        });
      }

      // La solicitud sale de la lista; el aviso de credenciales vive en el tablero.
      setMode("idle");
      setPending(false);
      router.refresh();
    } catch (caught) {
      setError(describeError(caught));
      setPending(false);
    }
  }

  return (
    <li className="rounded-xl border border-hub-border bg-hub-subtle p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-hub-text">{request.user.fullName}</p>
          <p className="break-all text-sm text-hub-muted">{request.user.email}</p>
        </div>
        <p className="text-xs text-hub-muted">{createdLabel}</p>
      </div>

      {request.message && (
        <blockquote className="mt-3 whitespace-pre-line border-l-2 border-hub-border pl-3 text-sm text-hub-soft">
          {request.message}
        </blockquote>
      )}

      {request.status !== "pending" && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-hub-muted">
          {request.approvedRole && <Badge>{roleLabel(request.approvedRole)}</Badge>}
          {request.reviewedBy && reviewedLabel && (
            <span>
              {request.status === "approved" ? "Aprobada" : "Rechazada"} por {request.reviewedBy.fullName} · {reviewedLabel}
            </span>
          )}
          {request.reviewComment && <span className="w-full text-hub-soft">“{request.reviewComment}”</span>}
        </div>
      )}

      {request.status === "pending" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {roles.length > 0 && (
            <Button variant="neutral" className="min-h-9 px-3.5 py-1.5" onClick={() => setMode("approve")}>
              <Check size={15} className="mr-1.5" aria-hidden="true" />
              Aprobar
            </Button>
          )}
          <Button variant="ghost" className="min-h-9 w-auto px-3.5 py-1.5" onClick={() => setMode("reject")}>
            <X size={15} className="mr-1.5" aria-hidden="true" />
            Rechazar
          </Button>
        </div>
      )}

      <Modal
        open={request.status === "pending" && mode !== "idle"}
        onClose={() => {
          if (!pending) {
            setMode("idle");
            setError(null);
          }
        }}
        title={mode === "approve" ? "Aprobar solicitud" : "Rechazar solicitud"}
        description={
          <>
            {request.user.fullName} · <span className="break-all">{request.user.email}</span>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}

          {mode === "approve" && (
            <div className="space-y-1.5">
              <label htmlFor={roleSelectId} className="block text-sm font-medium text-hub-soft">
                Rol institucional
              </label>
              <RoleSelect id={roleSelectId} name="roleCode" roles={roles} defaultValue="student" className="max-w-xs" />
            </div>
          )}

          <TextAreaField
            label={mode === "approve" ? "Comentario (opcional)" : "Motivo del rechazo (opcional)"}
            name="comment"
            maxLength={1000}
            rows={2}
          />

          <p className="text-sm text-hub-muted">
            {mode === "approve"
              ? "La cuenta quedará activa y se enviará una contraseña temporal a su correo institucional."
              : "La persona no podrá ingresar. Esta decisión no se puede deshacer desde la cola."}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" pending={pending} pendingLabel={mode === "approve" ? "Aprobando…" : "Rechazando…"} className="min-h-10">
              {mode === "approve" ? "Confirmar aprobación" : "Confirmar rechazo"}
            </Button>
            <Button
              variant="ghost"
              className="w-auto min-h-10 px-4"
              disabled={pending}
              onClick={() => {
                setMode("idle");
                setError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </li>
  );
}

type RequestsBoardProps = {
  requests: MembershipRequestItem[];
  actorRoles: RoleCode[];
  /** Fechas ya formateadas en el servidor (zona America/Bogota), por id de solicitud. */
  dates: Record<string, { created: string; reviewed: string | null }>;
  emptyMessage: string;
};

export function RequestsBoard({ requests, actorRoles, dates, emptyMessage }: RequestsBoardProps) {
  // Se conservan aunque la lista se recargue y la solicitud ya no aparezca en "Pendientes".
  const [results, setResults] = useState<CredentialsResult[]>([]);

  return (
    <div className="space-y-6">
      {results.length > 0 && (
        <div className="space-y-3" aria-live="polite">
          {results.map((result) => (
            <CredentialsNotice
              key={result.key}
              result={result}
              onUpdate={(updated) => setResults((current) => current.map((item) => (item.key === updated.key ? updated : item)))}
              onDismiss={() => setResults((current) => current.filter((item) => item.key !== result.key))}
            />
          ))}
        </div>
      )}

      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              actorRoles={actorRoles}
              createdLabel={dates[request.id]?.created ?? ""}
              reviewedLabel={dates[request.id]?.reviewed ?? null}
              onApproved={(result) => setResults((current) => [result, ...current.filter((item) => item.key !== result.key)])}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
