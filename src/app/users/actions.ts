"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { userCreateSchema, userUpdateSchema } from "@/lib/domain-schemas";
import { hasUsersDatabase } from "@/server/services/users-service";
import { logAuditEvent } from "@/server/services/audit-service";

function requireDatabase() {
  if (!hasUsersDatabase()) {
    throw new Error("DATABASE_URL is required to manage users.");
  }
}

async function requireAdminAccess() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new Error("You do not have permission to manage users.");
  }
  return user;
}

function parseCheckbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

export async function createUser(formData: FormData) {
  const actor = await requireAdminAccess();
  requireDatabase();

  const parsed = userCreateSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    password: formData.get("password"),
    isActive: parseCheckbox(formData.get("isActive"))
  });

  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid user data");

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username }
  });
  if (existing) throw new Error("Username already exists");

  const created = await prisma.user.create({
    data: {
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      passwordHash: hashPassword(parsed.data.password),
      isActive: parsed.data.isActive
    }
  });

  await logAuditEvent({ entity: "user", action: "create", payload: { id: created.id, username: created.username, role: created.role, actor: actor.username } });
  revalidatePath("/users");
}

export async function updateUser(formData: FormData) {
  const actor = await requireAdminAccess();
  requireDatabase();

  const parsed = userUpdateSchema.safeParse({
    id: formData.get("id"),
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    password: formData.get("password") || undefined,
    isActive: parseCheckbox(formData.get("isActive"))
  });

  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid user data");

  const target = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!target) throw new Error("User not found");

  if (target.role === "admin" && parsed.data.role !== "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      throw new Error("At least one admin must remain active");
    }
  }

  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing && existing.id !== target.id) throw new Error("Username already exists");

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      passwordHash: parsed.data.password ? hashPassword(parsed.data.password) : target.passwordHash
    }
  });

  await logAuditEvent({ entity: "user", action: "update", payload: { id: updated.id, username: updated.username, role: updated.role, actor: actor.username } });
  revalidatePath("/users");
}

export async function deleteUser(formData: FormData) {
  const actor = await requireAdminAccess();
  requireDatabase();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("User ID is required");
  if (actor.id === id) throw new Error("You cannot delete your own account");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("User not found");

  if (target.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      throw new Error("At least one admin must remain active");
    }
  }

  const deleted = await prisma.user.delete({ where: { id } });
  await logAuditEvent({ entity: "user", action: "delete", payload: { id: deleted.id, username: deleted.username, role: deleted.role, actor: actor.username } });
  revalidatePath("/users");
}

export async function toggleUserStatus(formData: FormData) {
  const actor = await requireAdminAccess();
  requireDatabase();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("User ID is required");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("User not found");

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !target.isActive }
  });

  await logAuditEvent({ entity: "user", action: "toggle-status", payload: { id: updated.id, username: updated.username, isActive: updated.isActive, actor: actor.username } });
  revalidatePath("/users");
}
