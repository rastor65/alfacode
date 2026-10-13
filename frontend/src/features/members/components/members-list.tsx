"use client";

import { LoaderCircle, UserPlus } from "lucide-react";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { type RoleCode, canManageMember, roleLabel } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";

import { ACCOUNT_STATUS_SINGULAR, type MemberDetail, type MemberListItem } from "../types";
import { InviteForm } from "./invite-form";
import { MemberAdminPanel } from "./member-admin-panel";

type Actor = { id: string; roles: RoleCode[] };

type MemberDetailContentProps = {
  member: MemberDetail | null;
  error: string | null;
  actor: Actor;
  onChanged: () => void;
};

/** Contenido del modal de detalle; los datos los carga `MembersList` al abrirlo. */
function MemberDetailContent({ member, error, actor, onChanged }: MemberDetailContentProps) {
  if (error && !member) {
    return <Alert tone="error">{error}</Alert>;
  }

  if (!member) {
    return (
      <p className="flex items-center gap-2 text-sm text-hub-muted" role="status">
        <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Cargando…
      </p>
    );
  }

  const manageable = canManageMember(actor, member);

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Estado</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5 text-sm text-hub-text">
            {ACCOUNT_STATUS_SINGULAR[member.accountStatus]}
            {member.mustChangePassword && <Badge>Contraseña temporal</Badge>}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Correo</dt>
          <dd className="mt-1 text-sm text-hub-text">{member.emailVerified ? "Verificado" : "Sin verificar"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Miembro desde</dt>
          <dd className="mt-1 text-sm text-hub-text">
            {formatDate(member.createdAt)}
          </dd>
        </div>
      </dl>

      <MemberAdminPanel
        member={member}
        actorRoles={actor.roles}
        onChanged={onChanged}
        lockedReason={
          manageable
            ? undefined
            : member.id === actor.id
              ? "No puedes cambiar tus propios roles ni tu estado; debe hacerlo otra autoridad."
              : "No tienes permiso para administrar esta cuenta."
        }
      />
    </div>
  );
}

/** Boton "Invitar integrante" con su modal (solo autoridades). */
export function InviteButton({ actorRoles }: { actorRoles: RoleCode[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="neutral" onClick={() => setOpen(true)} className="min-h-10" aria-haspopup="dialog">
        <UserPlus size={16} className="mr-2" aria-hidden="true" />
        Invitar integrante
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Invitar integrante">
        <InviteForm actorRoles={actorRoles} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

type MembersListProps = {
  members: MemberListItem[];
  actor: Actor;
  /** Admin o coordinator: abre el detalle de cada integrante en un modal. */
  authority: boolean;
};

export function MembersList({ members, actor, authority }: MembersListProps) {
  const [selected, setSelected] = useState<MemberListItem | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  // Evita que una respuesta tardia pise el detalle de otro integrante abierto despues.
  const currentId = useRef<string | null>(null);

  /** Se pide al abrir (evento) y tras cada accion, para mostrar siempre el estado real. */
  async function loadDetail(id: string) {
    try {
      const member = await apiRequest<MemberDetail>(`/users/${id}`);
      if (currentId.current === id) {
        setDetail(member);
        setDetailError(null);
      }
    } catch (caught) {
      if (currentId.current === id) {
        setDetailError(describeError(caught));
      }
    }
  }

  function open(member: MemberListItem) {
    currentId.current = member.id;
    setSelected(member);
    setDetail(null);
    setDetailError(null);
    void loadDetail(member.id);
  }

  function close() {
    currentId.current = null;
    setSelected(null);
  }

  return (
    <>
      {members.length > 0 && (
        <ul className="mt-3 divide-y divide-hub-border rounded-xl border border-hub-border">
          {members.map((member) => {
            const content = (
              <>
                <div className="min-w-0 text-left">
                  <p className="truncate font-medium text-hub-text">
                    {member.fullName}
                    {member.id === actor.id && <span className="ml-2 text-xs font-normal text-hub-muted">(tú)</span>}
                  </p>
                  {member.email && <p className="truncate text-sm text-hub-muted">{member.email}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {member.roles.map((role) => (
                    <Badge key={role}>{roleLabel(role)}</Badge>
                  ))}
                  {member.mustChangePassword && <Badge>Contraseña temporal</Badge>}
                </div>
              </>
            );

            return (
              <li key={member.id}>
                {authority ? (
                  <button
                    type="button"
                    onClick={() => open(member)}
                    aria-haspopup="dialog"
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-4 px-4 py-3">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={selected !== null}
        onClose={close}
        title={selected?.fullName ?? "Integrante"}
        description={selected?.email ? <span className="break-all">{selected.email}</span> : undefined}
        size="lg"
      >
        {selected && (
          <MemberDetailContent
            member={detail}
            error={detailError}
            actor={actor}
            onChanged={() => void loadDetail(selected.id)}
          />
        )}
      </Modal>
    </>
  );
}
