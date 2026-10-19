"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";
import { REQUEST_TYPES, type RequestItem } from "../types";

export function RequestForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter(), [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<"subject" | "description" | "type", string>>>({});
  const errorRef = useRef<HTMLDivElement>(null), formRef = useRef<HTMLFormElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const data = new FormData(event.currentTarget); setPending(true); setError(null); setErrors({});
    try {
      const row = await apiRequest<RequestItem>("/administrative-requests", { method: "POST", body: { type: data.get("type"), subject: data.get("subject"), description: data.get("description") } });
      router.push(`/hub/tramites/${row.id}`); router.refresh(); onCancel();
    } catch (caught) { setError(describeError(caught)); setErrors(fieldErrorMessages(caught, { subject: "Escribe un asunto de 3 a 200 caracteres.", description: "Explica la solicitud entre 10 y 10000 caracteres.", type: "Elige un tipo de trámite." })); requestAnimationFrame(() => errorRef.current?.focus()); }
    finally { setPending(false); }
  }
  return <form ref={formRef} onSubmit={submit} className="space-y-4" aria-busy={pending}>
    {error && <div ref={errorRef} tabIndex={-1}><Alert tone="error">{error}{Object.entries(errors).length > 0 && <ul className="mt-2 space-y-1">{Object.entries(errors).map(([name, message]) => <li key={name}><button type="button" className="text-left underline" onClick={() => (formRef.current?.elements.namedItem(name) as HTMLElement | null)?.focus()}>{message}</button></li>)}</ul>}</Alert></div>}
    <div><label htmlFor="request-type" className="mb-1 block text-sm font-medium">Tipo de trámite</label><OptionSelect id="request-type" name="type" defaultValue="general" options={Object.entries(REQUEST_TYPES).map(([value, label]) => ({ value, label }))} disabled={pending} /></div>
    <FormField label="Asunto" name="subject" required minLength={3} maxLength={200} error={errors.subject} disabled={pending} />
    <TextAreaField label="Descripción" name="description" rows={6} required minLength={10} maxLength={10000} error={errors.description} disabled={pending} hint="Explica qué necesitas y por qué. Podrás adjuntar soportes después de registrar el trámite." />
    <p className="text-sm text-hub-muted">Los certificados se preparan de forma manual. Aprobar cambios de datos o responsabilidades no los aplica automáticamente; la coordinación registra su ejecución.</p>
    <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="neutral" onClick={onCancel} disabled={pending}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? "Registrando…" : "Registrar solicitud"}</Button></div>
  </form>;
}
