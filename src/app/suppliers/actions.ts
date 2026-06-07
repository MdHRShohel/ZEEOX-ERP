"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { supplierSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSuppliers) throw new Error("Forbidden");
  return session;
}

export async function createSupplier(formData: FormData) {
  const session = await requireAdmin();
  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supplier = await prisma.supplier.create({ data: parsed.data });
  await logAudit({ entityType: "Supplier", entityId: supplier.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/suppliers");
  return { success: true };
}

export async function updateSupplier(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.supplier.update({ where: { id }, data: parsed.data });
  await logAudit({ entityType: "Supplier", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  return { success: true };
}

export async function deleteSupplier(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const count = await prisma.purchaseOrder.count({ where: { supplierId: id } });
  if (count > 0) return { error: `Cannot delete: ${count} purchase order(s) linked to this supplier.` };
  await prisma.supplier.delete({ where: { id } });
  await logAudit({ entityType: "Supplier", entityId: id, action: "delete", actorId: session.id, actorName: session.displayName });
  revalidatePath("/suppliers");
  return { success: true };
}
