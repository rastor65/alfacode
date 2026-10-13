"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { type CredentialsResult, CredentialsNotice } from "@/features/membership/components/credentials-notice";
import type { TemporaryCredentials } from "@/features/membership/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { type RoleCode, assignableRoles, roleLabel } from "@/lib/auth/roles";

import { roleToggles } from "../role-toggles";
import type { MemberDetail } from "../types";
import { RoleSelect } from "./role-select";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hub-border pt-6">
      <h2 className="text-base font-semibold text-hub-text">{title}</h2>
      {description && <p className="mt-1 text-sm text-hub-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

type MemberAdminPanelProps = {
  member: MemberDetail;
  actorRoles: RoleCode[];
  /** Se llama tras cada cambio, para volver a cargar el detalle. */
  onChanged?: () => void;
  /** Solo lectura: los roles se muestran bloqueados con este motivo y no hay mas acciones. */
  lockedReason?: string;
};

/** Acciones de administracion (F1-13). La interfaz solo se muestra a quien puede administrar. */
export function MemberAdminPanel({ member, actorRoles, onChanged, lockedReason }: MemberAdminPanelProps) {
  const router = useRouter();
  const rolesId = useId();
  const activationRoleId = useId();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResult | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const assignable = assignableRoles(actorRoles);
  const needsRoleToActivate = member.roles.length === 0;

  async function run<T>(key: string, action: () => Promise<T>, success: (result: T) => void) {
    setBusy(key);
    setError(null);
    setNotice(null);

    try {
      success(await action());
      onChanged?.();
      router.refresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(null);
    }
  }

  function credentialsFrom(result: { credentials?: TemporaryCredentials }) {
    if (result.credentials) {
      setCredentials({
        key: member.id,
        userId: member.id,
        fullName: member.fullName,
        email: member.email,
        credentials: result.credentials,
      });
    }
  }

  function changeStatus(event: FormEvent<HTMLFormElement>, status: "active" | "inactive") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    const roleCode = form.get("roleCode");

    void run(
      "status",
      () =>
        apiRequest<{ credentials?: TemporaryCredentials }>(`/users/${member.id}/status`, {
          method: "PATCH",
          body: { status, ...(reason ? { reason } : {}), ...(roleCode ? { roleCode: String(roleCode) } : {}) },
        }),
      (result) => {
        setConfirmDeactivate(false);
        setNotice(status === "active" ? "Cuenta activada." : "Cuenta desactivada. Sus sesiones se cerraron.");
        credentialsFrom(result);
      },
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      {credentials && (
        <CredentialsNotice result={credentials} onUpdate={setCredentials} onDismiss={() => setCredentials(null)} />
      )}

      <Section title="Roles" description="Activa o desactiva los roles institucionales de esta persona. Con varios roles se suman los permisos.">
        <ul className="divide-y divide-hub-border rounded-xl border border-hub-border">
          {roleToggles(member, actorRoles, lockedReason ?? null).map(({ role, checked, disabled, reason }) => {
            const switchId = `${rolesId}-${role}`;
            const pending = busy === `role-${role}`;

            return (
              <li key={role} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <label htmlFor={switchId} className="text-sm font-medium text-hub-text">
                    {roleLabel(role)}
                  </label>
                  {reason && (
                    <p id={`${switchId}-reason`} className="mt-0.5 text-xs text-hub-muted">
                      {reason}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {pending && (
                    <LoaderCircle size={15} className="animate-spin text-hub-muted motion-reduce:animate-none" aria-hidden="true" />
                  )}
                  <Switch
                    id={switchId}
                    checked={checked}
                    disabled={disabled || busy !== null}
                    aria-describedby={reason ? `${switchId}-reason` : undefined}
                    onCheckedChange={(next) =>
                      void run(
                        `role-${role}`,
                        () =>
                          next
                            ? apiRequest(`/users/${member.id}/roles`, { method: "POST", body: { roleCode: role } })
                            : apiRequest(`/users/${member.id}/roles/${role}`, { method: "DELETE" }),
                        () => setNotice(next ? `Se asignó el rol ${roleLabel(role)}.` : `Se quitó el rol ${roleLabel(role)}.`),
                      )
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {!lockedReason && (
        <>
          <Section title="Estado de la cuenta">
            {member.accountStatus === "pending" && (
              <p className="text-sm text-hub-muted">Esta cuenta tiene una solicitud pendiente; resuélvela desde Solicitudes.</p>
            )}

            {member.accountStatus === "active" &&
              (confirmDeactivate ? (
                <form onSubmit={(event) => changeStatus(event, "inactive")} className="space-y-4">
                  <TextAreaField label="Motivo (opcional)" name="reason" maxLength={500} rows={2} />
                  <p className="text-sm text-hub-muted">La persona perderá el acceso de inmediato y se cerrarán sus sesiones.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" className="min-h-10" pending={busy === "status"} pendingLabel="Desactivando…">
                      Confirmar desactivación
                    </Button>
                    <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setConfirmDeactivate(false)} disabled={busy !== null}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <Button variant="neutral" className="min-h-10" onClick={() => setConfirmDeactivate(true)} disabled={busy !== null}>
                  Desactivar cuenta
                </Button>
              ))}

            {(member.accountStatus === "inactive" || member.accountStatus === "rejected") && (
              <form onSubmit={(event) => changeStatus(event, "active")} className="space-y-4">
                {needsRoleToActivate && (
                  <div className="w-52 space-y-1.5">
                    <label htmlFor={activationRoleId} className="block text-sm font-medium text-hub-soft">
                      Rol con el que se activará
                    </label>
                    <RoleSelect id={activationRoleId} name="roleCode" roles={assignable} defaultValue="student" />
                  </div>
                )}
                <TextAreaField label="Motivo (opcional)" name="reason" maxLength={500} rows={2} />
                {(member.accountStatus === "rejected" || !member.emailVerified) && (
                  <p className="text-sm text-hub-muted">Se enviará una contraseña temporal a su correo institucional.</p>
                )}
                <Button type="submit" className="min-h-10" pending={busy === "status"} pendingLabel="Activando…">
                  Activar cuenta
                </Button>
              </form>
            )}
          </Section>

          {member.accountStatus === "active" && (
            <Section
              title="Contraseña temporal"
              description="Genera una nueva si la persona no recibió el correo o la suya venció. Se cerrarán sus sesiones y deberá cambiarla al ingresar."
            >
              <Button
                variant="neutral"
                className="min-h-10"
                pending={busy === "reissue"}
                pendingLabel="Generando…"
                disabled={busy !== null}
                onClick={() =>
                  void run(
                    "reissue",
                    () =>
                      apiRequest<{ credentials: TemporaryCredentials }>(`/users/${member.id}/temporary-password`, {
                        method: "POST",
                      }),
                    credentialsFrom,
                  )
                }
              >
                <KeyRound size={15} className="mr-1.5" aria-hidden="true" />
                Generar contraseña temporal
              </Button>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
