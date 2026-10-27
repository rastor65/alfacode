"use client";

import { Check, CircleAlert, FileText, GraduationCap, Info, MailCheck, MailWarning, MapPin, Microscope, User as UserIcon, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { RoleSelect } from "@/features/members/components/role-select";
import { chip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { relativeTime } from "@/features/tracking/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { type RoleCode, assignableRoles, roleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

import { type MembershipRequestItem, type StudentCvData, type TemporaryCredentials, initialsOf } from "../types";
import { type CredentialsResult, CredentialsNotice } from "./credentials-notice";

type Mode = "idle" | "approve" | "reject";

const actionButton =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-50";

const STATUS_TONE = {
  approved: `${chip} bg-hub-success-bg text-hub-success-text`,
  rejected: `${chip} bg-hub-danger-bg text-hub-danger-text`,
} as const;

/** Un dato de la Hoja de Vida: etiqueta y valor, o «No registrado» en cursiva. */
function CvField({ label, value, wide, mono }: { label: string; value?: string | null; wide?: boolean; mono?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-[11px] text-hub-muted">{label}</dt>
      <dd className={cn("mt-0.5 wrap-break-word text-sm", value ? "font-medium text-hub-text" : "italic text-hub-muted", mono && "font-mono")}>{value || "No registrado"}</dd>
    </div>
  );
}

function CvBlock({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className={cn(panelCard, "flex flex-col gap-3 p-4")}>
      <h3 className={cn(eyebrow, "flex items-center gap-2 text-hub-accent")}>
        <Icon aria-hidden="true" className="size-4" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function CvText({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-hub-muted">{label}</span>
      <p className="whitespace-pre-line rounded-lg bg-hub-subtle p-3 text-sm text-hub-soft">{value}</p>
    </div>
  );
}

/** Hoja de Vida del aspirante en tres bloques: identificacion, informacion academica e interes investigativo. */
function CvDetails({ cv, request }: { cv: StudentCvData; request: MembershipRequestItem }) {
  const fullName = `${cv.nombres || request.user.fullName} ${cv.apellidos || ""}`.trim();

  return (
    <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
      <CvBlock icon={UserIcon} title="a) Identificación y contacto">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <CvField label="Nombre completo" value={fullName} />
          <CvField label="Documento de identidad" value={cv.documentoIdentidad} mono />
          <CvField label="Correo institucional" value={request.user.email} mono />
          <CvField label="Celular" value={cv.celular} />
          <CvField label="Fecha de nacimiento" value={cv.fechaNacimiento} />
          <CvField label="Nacionalidad" value={cv.nacionalidad} />
          {cv.telefonoFijo && <CvField label="Teléfono fijo" value={cv.telefonoFijo} />}
          {cv.fechaElaboracion && <CvField label="Fecha de elaboración" value={cv.fechaElaboracion} />}
        </dl>
      </CvBlock>

      <CvBlock icon={GraduationCap} title="b) Información académica">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <CvField label="Facultad" value={cv.facultad} />
          <CvField label="Programa académico" value={cv.programa} />
          <CvField label="Sede" value={cv.sede} />
          <CvField label="Semestre actual" value={cv.semestreActual} />
          <CvField label="Promedio académico" value={cv.promedioAcademico} mono />
        </dl>
      </CvBlock>

      <CvBlock icon={Microscope} title="c) Perfil e interés investigativo">
        <CvText label="Líneas de investigación de interés" value={cv.lineasInvestigacion} />
        <CvText label="Experiencia investigativa y proyectos" value={cv.experienciaInvestigativa} />
        <CvText label="Áreas y temáticas de estudio" value={cv.areasEstudio} />
        <CvText label="Publicaciones recientes" value={cv.publicaciones} />
        <CvText label="Prácticas o pasantías" value={cv.practicasPasantias} />
        <CvText label="Motivación declarada" value={request.message ?? undefined} />
        {!cv.lineasInvestigacion && !cv.experienciaInvestigativa && !cv.areasEstudio && !cv.publicaciones && !cv.practicasPasantias && !request.message && (
          <p className="text-sm italic text-hub-muted">No registrado</p>
        )}
      </CvBlock>
    </div>
  );
}

function RequestCard({
  request,
  actorRoles,
  cutoff,
  createdLabel,
  reviewedLabel,
  onApproved,
}: {
  request: MembershipRequestItem;
  actorRoles: RoleCode[];
  cutoff: string;
  createdLabel: string;
  reviewedLabel: string | null;
  onApproved: (result: CredentialsResult) => void;
}) {
  const router = useRouter();
  const roleSelectId = useId();
  const [mode, setMode] = useState<Mode>("idle");
  const [showCv, setShowCv] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roles = assignableRoles(actorRoles);
  const cv = request.cvData;
  const waiting = relativeTime(request.createdAt, cutoff);
  const isPending = request.status === "pending";

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
    <li className={cn(panelCard, "flex flex-col gap-4 p-5 transition-shadow hover:shadow-md")}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-hub-accent-soft text-base font-bold text-hub-accent">
            {initialsOf(request.user.fullName)}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="wrap-break-word text-base font-semibold text-hub-text">{request.user.fullName}</h3>
              {request.user.emailVerified ? (
                <span className={`${neutralChip} gap-1`}>
                  <MailCheck aria-hidden="true" className="size-3 text-hub-accent" />
                  Correo verificado
                </span>
              ) : (
                <span className={`${chip} gap-1 bg-hub-danger-bg text-hub-danger-text`}>
                  <MailWarning aria-hidden="true" className="size-3" />
                  Correo sin verificar
                </span>
              )}
              {!cv && (
                <span className={`${neutralChip} gap-1`}>
                  <CircleAlert aria-hidden="true" className="size-3" />
                  Sin Hoja de Vida
                </span>
              )}
              {!isPending && <span className={cn(STATUS_TONE[request.status as "approved" | "rejected"], "rounded-full px-2.5 py-1")}>{request.status === "approved" ? "Aprobada" : "Rechazada"}</span>}
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-hub-muted">
              <span className="break-all">{request.user.email}</span>
              {cv?.documentoIdentidad && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{cv.documentoIdentidad}</span>
                </>
              )}
            </p>
            <p className="text-xs text-hub-muted">
              Radicada {waiting ? `${waiting.toLowerCase()} · ` : ""}
              <time dateTime={request.createdAt}>{createdLabel}</time>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start lg:self-center">
          {cv && (
            <button type="button" onClick={() => setShowCv(true)} aria-haspopup="dialog" className={`${actionButton} bg-hub-subtle text-hub-text hover:bg-hub-hover`}>
              <FileText aria-hidden="true" className="size-4 text-hub-accent" />
              Ver Hoja de Vida
            </button>
          )}
          {isPending && roles.length > 0 && (
            <button type="button" onClick={() => setMode("approve")} aria-haspopup="dialog" className={`${actionButton} bg-hub-accent text-hub-bg hover:opacity-90`}>
              <Check aria-hidden="true" className="size-4" />
              Aprobar
            </button>
          )}
          {isPending && (
            <button type="button" onClick={() => setMode("reject")} aria-haspopup="dialog" className={`${actionButton} text-hub-muted hover:bg-hub-danger-bg hover:text-hub-danger-text`}>
              <X aria-hidden="true" className="size-4" />
              Rechazar
            </button>
          )}
        </div>
      </div>

      {(request.message || cv) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className={cn("flex flex-col gap-1 rounded-lg bg-hub-subtle p-3", cv ? "lg:col-span-7" : "lg:col-span-12")}>
            <span className={eyebrow}>Motivación de vinculación</span>
            {request.message ? (
              <blockquote className="whitespace-pre-line text-sm italic text-hub-text">“{request.message}”</blockquote>
            ) : (
              <p className="text-sm italic text-hub-muted">No registrada</p>
            )}
          </div>
          {cv && (
            <div className="flex flex-col justify-center gap-1.5 rounded-lg border border-hub-border p-3 lg:col-span-5">
              <span className={eyebrow}>Resumen de la Hoja de Vida</span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {cv.programa && (
                  <span className="inline-flex items-center gap-1 font-semibold text-hub-accent">
                    <GraduationCap aria-hidden="true" className="size-3.5" />
                    {cv.programa}
                  </span>
                )}
                {cv.semestreActual && <span className="text-hub-soft">· {cv.semestreActual}</span>}
                {cv.sede && (
                  <span className="inline-flex items-center gap-1 text-hub-muted">
                    <MapPin aria-hidden="true" className="size-3" />
                    {cv.sede}
                  </span>
                )}
                {cv.promedioAcademico && <span className="rounded bg-hub-subtle px-1.5 py-0.5 font-mono font-semibold text-hub-text">Promedio: {cv.promedioAcademico}</span>}
                {!cv.programa && !cv.semestreActual && !cv.sede && !cv.promedioAcademico && <span className="italic text-hub-muted">Sin datos académicos</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {!isPending && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-hub-border pt-3 text-sm text-hub-muted">
          {request.approvedRole && <span className={neutralChip}>{roleLabel(request.approvedRole)}</span>}
          {request.reviewedBy && reviewedLabel && (
            <span>
              {request.status === "approved" ? "Aprobada" : "Rechazada"} por {request.reviewedBy.fullName} · {reviewedLabel}
            </span>
          )}
          {request.reviewComment && <span className="w-full text-hub-soft">“{request.reviewComment}”</span>}
        </div>
      )}

      {/* Modal de Hoja de Vida Completa del Aspirante */}
      {cv && (
        <Modal
          open={showCv}
          onClose={() => setShowCv(false)}
          title="Hoja de Vida del aspirante"
          description={`${cv.nombres || request.user.fullName} ${cv.apellidos || ""} · ${request.user.email}`}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <CvDetails cv={cv} request={request} />
            <div className="flex flex-wrap justify-end gap-2 border-t border-hub-border pt-3">
              <Button variant="ghost" onClick={() => setShowCv(false)}>
                Cerrar
              </Button>
              {isPending && roles.length > 0 && (
                <Button
                  variant="neutral"
                  onClick={() => {
                    setShowCv(false);
                    setMode("approve");
                  }}
                >
                  <Check size={14} className="mr-1.5" aria-hidden="true" />
                  Proceder a aprobar
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={isPending && mode !== "idle"}
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

          <p className="flex items-start gap-2 rounded-lg bg-hub-subtle p-3 text-sm text-hub-muted">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-hub-accent" />
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
  /** Instante de corte de la pagina, para los tiempos relativos. */
  cutoff: string;
  /** Fechas ya formateadas en el servidor (zona America/Bogota), por id de solicitud. */
  dates: Record<string, { created: string; reviewed: string | null }>;
  emptyMessage: string;
};

export function RequestsBoard({ requests, actorRoles, cutoff, dates, emptyMessage }: RequestsBoardProps) {
  // Se conservan aunque la lista se recargue y la solicitud ya no aparezca en "Pendientes".
  const [results, setResults] = useState<CredentialsResult[]>([]);

  return (
    <div className="flex flex-col gap-4">
      {results.length > 0 && (
        <div className="flex flex-col gap-3" aria-live="polite">
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
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              actorRoles={actorRoles}
              cutoff={cutoff}
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
