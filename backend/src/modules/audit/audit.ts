import type { EntityManager } from "typeorm";

import { AuditEvent } from "./audit-event.entity";

export interface AuditInput {
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
}

/** Registra un evento dentro de la misma transaccion que el cambio auditado. */
export async function recordAudit(manager: EntityManager, input: AuditInput) {
  await manager.save(
    manager.create(AuditEvent, {
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      details: input.details ? JSON.stringify(input.details) : null,
    }),
  );
}
