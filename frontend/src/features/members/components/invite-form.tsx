"use client";

import { Check, Copy } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";
import { type RoleCode, assignableRoles, roleLabel } from "@/lib/auth/roles";

import { RoleSelect } from "./role-select";

type InvitationResult =
  | { delivery: "email"; email: string; role: RoleCode; expiresAt: string }
  | { delivery: "manual"; email: string; role: RoleCode; expiresAt: string; acceptUrl: string };

/** F1-10: invitacion de un solo uso (72 h) con el rol autorizado para quien invita. Va dentro de un modal. */
export function InviteForm({ actorRoles, onClose }: { actorRoles: RoleCode[]; onClose: () => void }) {
  const roleId = useId();
  const roles = assignableRoles(actorRoles);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [result, setResult] = useState<InvitationResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    setPending(true);
    setError(null);
    setEmailError(undefined);
    setResult(null);
    setCopied(false);

    try {
      const response = await apiRequest<InvitationResult>("/invitations", {
        method: "POST",
        body: { email: String(form.get("email") ?? ""), roleCode: String(form.get("roleCode") ?? "student") },
      });
      setResult(response);
      formElement.reset();
    } catch (caught) {
      setEmailError(fieldErrorMessages(caught, { email: "Ingresa un correo válido." }).email);
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-hub-muted">
        La persona recibirá un enlace de un solo uso, válido por 72 horas, para crear su cuenta con el rol elegido.
      </p>

      {result && (
        <Alert tone={result.delivery === "manual" ? "info" : "success"}>
          {result.delivery === "email" ? (
            <p>
              Invitación enviada a <span className="break-all font-medium">{result.email}</span> como{" "}
              {roleLabel(result.role)}.
            </p>
          ) : (
            <div className="space-y-2">
              <p>
                No hay correo configurado. Entrega este enlace a <span className="break-all font-medium">{result.email}</span>{" "}
                por un medio seguro; solo se muestra ahora.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="max-w-full break-all rounded-md border border-hub-border bg-hub-panel px-2.5 py-1.5 font-mono text-xs text-hub-text">
                  {result.acceptUrl}
                </code>
                <Button variant="neutral" onClick={() => copy(result.acceptUrl)} className="min-h-9 px-3 py-1.5">
                  {copied ? <Check size={15} className="mr-1.5" aria-hidden="true" /> : <Copy size={15} className="mr-1.5" aria-hidden="true" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
          )}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <FormField
            label="Correo institucional"
            name="email"
            type="email"
            autoComplete="off"
            placeholder="nombre@uniguajira.edu.co"
            required
            maxLength={254}
            error={emailError}
          />
          <div className="space-y-1.5">
            <label htmlFor={roleId} className="block text-sm font-medium text-hub-soft">
              Rol
            </label>
            <RoleSelect id={roleId} name="roleCode" roles={roles} defaultValue="student" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" pending={pending} pendingLabel="Enviando…" className="min-h-10">
            Enviar invitación
          </Button>
          <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={onClose} disabled={pending}>
            Cerrar
          </Button>
        </div>
      </form>
    </div>
  );
}
