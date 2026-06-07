"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { userCreateSchema, userUpdateSchema, resetPasswordSchema } from "@/lib/domain-schemas";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageUsers) throw new Error("Forbidden");
  return session;
}

export async function createUser(formData: FormData) {
  const session = await requireAdmin();
  const parsed = userCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) return { error: "Username already taken" };
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { username: parsed.data.username, displayName: parsed.data.displayName, passwordHash, role: parsed.data.role },
  });
  await logAudit({ entityType: "User", entityId: user.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/users");
  return { success: true };
}

export async function updateUser(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = userUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.user.update({ where: { id }, data: parsed.data });
  await logAudit({ entityType: "User", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/users");
  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const session = await requireAdmin();
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: parsed.data.userId }, data: { passwordHash } });
  await logAudit({ entityType: "User", entityId: parsed.data.userId, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/users");
  return { success: true };
}

export async function toggleUserActive(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === session.id) return { error: "Cannot deactivate your own account" };
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: "Not found" };
  await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  await logAudit({ entityType: "User", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/users");
  return { success: true };
}
