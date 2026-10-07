"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/access";
import {
  assignRoleToUser,
  removeRoleFromUser,
  updateUserStatus,
} from "@/features/users/services/user-management-repository";

export async function assignRoleAction(formData: FormData) {
  await requirePermission("users.manage");

  const userId = String(formData.get("userId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");

  if (!userId || !roleId) {
    return;
  }

  await assignRoleToUser(userId, roleId);
  revalidatePath("/app/usuarios");
  revalidatePath("/app/roles");
}

export async function removeRoleAction(formData: FormData) {
  await requirePermission("users.manage");

  const userId = String(formData.get("userId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");

  if (!userId || !roleId) {
    return;
  }

  await removeRoleFromUser(userId, roleId);
  revalidatePath("/app/usuarios");
  revalidatePath("/app/roles");
}

export async function updateUserStatusAction(formData: FormData) {
  await requirePermission("users.manage");

  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!userId || (status !== "ACTIVE" && status !== "INACTIVE")) {
    return;
  }

  await updateUserStatus(userId, status);
  revalidatePath("/app/usuarios");
}
