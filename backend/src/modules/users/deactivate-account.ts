import { IsNull, type EntityManager } from "typeorm";
import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import { Session } from "../auth/session.entity";
import { actorRoles, type Actor } from "../projects/project-access";
import { canManageUser } from "../roles/role-policy";
import { User } from "./user.entity";

/** Regla compartida por gestion de integrantes y tramite de salida, en la transaccion llamante. */
export async function deactivateAccount(m: EntityManager, actor: Actor, target: User, reason: string | null, now = new Date()) {
  if (actor.id === target.id) throw new ApiError(403, "CANNOT_CHANGE_OWN_STATUS", "No puedes cambiar tu propio estado");
  const roles = (target.roles ?? []).map(r => r.code);
  if (!canManageUser(actorRoles(actor), roles)) throw new ApiError(403, "USER_NOT_MANAGEABLE", "No puedes administrar a esta persona");
  if (!["active", "inactive"].includes(target.accountStatus)) throw new ApiError(409, "INVALID_STATUS_TRANSITION", "La cuenta no admite desvinculacion");
  if (target.accountStatus === "active" && roles.includes("admin")) {
    const others = await m.createQueryBuilder(User, "u").innerJoin("u.roles", "r", "r.code = :code", { code: "admin" })
      .where("u.accountStatus = :active AND u.id != :id", { active: "active", id: target.id }).getCount();
    if (!others) throw new ApiError(409, "LAST_ADMIN", "No se puede dejar el sistema sin un administrador activo");
  }
  if (target.accountStatus === "active") {
    await m.update(User, target.id, { accountStatus: "inactive" });
    await recordAudit(m, { actorUserId: actor.id, action: "user.status_changed", targetType: "user", targetId: target.id,
      details: { from: "active", to: "inactive", reason, assignedRole: null, temporaryPassword: null } });
  }
  await m.update(Session, { userId: target.id, revokedAt: IsNull() }, { revokedAt: now });
}
