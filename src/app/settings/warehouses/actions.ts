"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { warehouseSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSettings) throw new Error("Forbidden");
  return session;
}

export async function createWarehouse(formData: FormData) {
  const session = await requireAdmin();
  const parsed = warehouseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const wh = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.warehouse.updateMany({ data: { isDefault: false } });
    }
    return tx.warehouse.create({ data: parsed.data });
  });

  await logAudit({ entityType: "Warehouse", entityId: wh.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/settings/warehouses");
  return { success: true };
}

export async function updateWarehouse(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = warehouseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.warehouse.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    }
    return tx.warehouse.update({ where: { id }, data: parsed.data });
  });

  await logAudit({ entityType: "Warehouse", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/settings/warehouses");
  return { success: true };
}

export async function deleteWarehouse(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const [poCount, grnCount] = await Promise.all([
    prisma.purchaseOrder.count({ where: { warehouseId: id } }),
    prisma.goodsReceipt.count({ where: { warehouseId: id } }),
  ]);
  if (poCount + grnCount > 0) return { error: "Cannot delete: warehouse has linked purchase orders or receipts." };
  await prisma.warehouse.delete({ where: { id } });
  await logAudit({ entityType: "Warehouse", entityId: id, action: "delete", actorId: session.id, actorName: session.displayName });
  revalidatePath("/settings/warehouses");
  return { success: true };
}
