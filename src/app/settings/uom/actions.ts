"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { uomSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSettings) throw new Error("Forbidden");
  return session;
}

export async function createUom(formData: FormData) {
  const session = await requireAdmin();
  const parsed = uomSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const uom = await prisma.unitOfMeasure.create({ data: parsed.data });
  await logAudit({ entityType: "UnitOfMeasure", entityId: uom.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/settings/uom");
  return { success: true };
}

export async function updateUom(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = uomSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.unitOfMeasure.update({ where: { id }, data: parsed.data });
  await logAudit({ entityType: "UnitOfMeasure", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/settings/uom");
  return { success: true };
}

export async function deleteUom(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const count = await prisma.productVariant.count({ where: { uomId: id } });
  if (count > 0) return { error: `Cannot delete: ${count} product(s) use this unit.` };
  await prisma.unitOfMeasure.delete({ where: { id } });
  await logAudit({ entityType: "UnitOfMeasure", entityId: id, action: "delete", actorId: session.id, actorName: session.displayName });
  revalidatePath("/settings/uom");
  return { success: true };
}
