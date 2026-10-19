import type { ProjectAccess } from "../projects/project-policy";
import { isAuthority } from "../roles/role-policy";
import type { RoleCode } from "../roles/role.entity";
import type { AccessLevel, DocumentScope } from "./document.entity";

/** Lo que se sabe de quien consulta un documento concreto. */
export interface DocumentViewer {
  roles: readonly RoleCode[];
  userId: string;
  /** Acceso al proyecto del documento; `none` en documentos institucionales o si no participa. */
  projectAccess: ProjectAccess;
  /** Autorizacion expresa para este documento. */
  granted: boolean;
}

export interface DocumentFacts {
  scope: DocumentScope;
  accessLevel: AccessLevel;
  uploadedBy: string | null;
}

/**
 * F3-08 y DEC-029. Quien puede ver metadatos y descargar:
 * - `general`: cualquier integrante activo del semillero;
 * - `restricted`: equipo del proyecto (o la coordinacion, en documentos institucionales);
 * - `private`: quien lo subio, las personas autorizadas expresamente, admin y coordinator.
 * Quien lo subio y las autoridades lo ven siempre.
 */
export function canReadDocument(viewer: DocumentViewer, document: DocumentFacts) {
  if (isAuthority(viewer.roles) || document.uploadedBy === viewer.userId) {
    return true;
  }

  switch (document.accessLevel) {
    case "general":
      return true;
    case "restricted":
      return document.scope === "project" && viewer.projectAccess !== "none";
    case "private":
      return viewer.granted;
  }
}

/**
 * Editar metadatos, permisos o eliminar: quien lo subio o quien gestiona el proceso asociado
 * (autoridad o lider del proyecto; en documentos institucionales, la coordinacion). Siempre
 * que ademas pueda verlo: el lider no gestiona el documento privado de otra persona.
 */
export function canManageDocument(viewer: DocumentViewer, document: DocumentFacts) {
  if (!canReadDocument(viewer, document)) {
    return false;
  }

  if (isAuthority(viewer.roles) || document.uploadedBy === viewer.userId) {
    return true;
  }

  return document.scope === "project" && viewer.projectAccess === "leader";
}

/** Suben documentos: el equipo del proyecto; al repositorio institucional, la coordinacion. */
export function canUploadDocument(roles: readonly RoleCode[], scope: DocumentScope, projectAccess: ProjectAccess) {
  return scope === "institutional" ? isAuthority(roles) : projectAccess !== "none";
}
