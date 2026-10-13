"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";

import type { TemporaryCredentials } from "../types";

export type CredentialsResult = {
  key: string;
  userId: string;
  fullName: string;
  email: string;
  credentials: TemporaryCredentials;
};

/**
 * Resultado de entregar una contrasena temporal. En modo manual la contrasena se muestra
 * solo aqui y desaparece al cerrar el aviso: no se guarda en ningun otro lugar.
 */
export function CredentialsNotice({
  result,
  onUpdate,
  onDismiss,
}: {
  result: CredentialsResult;
  onUpdate: (result: CredentialsResult) => void;
  onDismiss: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { credentials } = result;

  async function retry() {
    setRetrying(true);
    setRetryError(null);

    try {
      const response = await apiRequest<{ credentials: TemporaryCredentials }>(
        `/users/${result.userId}/temporary-password`,
        { method: "POST" },
      );
      onUpdate({ ...result, credentials: response.credentials });
    } catch (caught) {
      setRetryError(describeError(caught));
    } finally {
      setRetrying(false);
    }
  }

  async function copy(password: string) {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const tone = credentials.delivery === "failed" ? "error" : credentials.delivery === "manual" ? "info" : "success";

  return (
    <Alert tone={tone} className="relative pr-10">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        aria-label={`Cerrar aviso de ${result.fullName}`}
      >
        <X size={15} aria-hidden="true" />
      </button>

      {credentials.delivery === "email" && (
        <p>
          <span className="font-medium">{result.fullName}</span> ya puede ingresar. Enviamos su contraseña temporal a{" "}
          <span className="break-all">{result.email}</span>; vence en 72 horas.
        </p>
      )}

      {credentials.delivery === "failed" && (
        <div className="space-y-3">
          <p>
            La cuenta de <span className="font-medium">{result.fullName}</span> quedó activa, pero no pudimos enviar el
            correo con su contraseña temporal.
          </p>
          {retryError && <p className="font-medium">{retryError}</p>}
          <Button variant="neutral" onClick={retry} pending={retrying} pendingLabel="Reenviando…">
            Generar y reenviar contraseña
          </Button>
        </div>
      )}

      {credentials.delivery === "manual" && (
        <div className="space-y-3">
          <p>
            No hay correo configurado. Entrega esta contraseña temporal a{" "}
            <span className="font-medium">{result.fullName}</span> por un medio seguro. Solo se muestra ahora y vence en 72
            horas.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md border border-hub-border bg-hub-panel px-2.5 py-1.5 font-mono text-sm text-hub-text">
              {credentials.temporaryPassword}
            </code>
            <Button variant="neutral" onClick={() => copy(credentials.temporaryPassword)} className="min-h-9 px-3 py-1.5">
              {copied ? <Check size={15} className="mr-1.5" aria-hidden="true" /> : <Copy size={15} className="mr-1.5" aria-hidden="true" />}
              {copied ? "Copiada" : "Copiar"}
            </Button>
          </div>
        </div>
      )}
    </Alert>
  );
}
