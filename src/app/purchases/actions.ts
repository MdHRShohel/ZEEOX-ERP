"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { purchaseOrderSchema, purchaseOrderItemSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";
import { computePoTotal } from "@/lib/calculations";

async function requireAdmin() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManagePurchases) throw new Error("Forbidden");
  return session;
}

export async function createPurchaseOrder(formData: FormData) {
  const session = await requireAdmin();
  const parsed = purchaseOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const po = await prisma.purchaseOrder.create({
    data: { ...parsed.data, status: "draft", totalAmount: 0 },
  });
  await logAudit({ entityType: "PurchaseOrder", entityId: po.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/purchases");
  redirect(`/purchases/${po.id}`);
}

export async function addPurchaseOrderItem(formData: FormData) {
  const session = await requireAdmin();
  const parsed = purchaseOrderItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: parsed.data.purchaseOrderId },
    include: { items: true },
  });
  if (!po) return { error: "Purchase order not found" };
  if (!["draft", "confirmed"].includes(po.status)) return { error: "Cannot edit items on this PO" };

  await prisma.purchaseOrderItem.create({ data: parsed.data });

  const items = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });
  const total = computePoTotal(items.map((i) => ({ orderedQty: i.orderedQty, unitCost: Number(i.unitCost) })));
  await prisma.purchaseOrder.update({ where: { id: po.id }, data: { totalAmount: total } });

  revalidatePath(`/purchases/${po.id}`);
  return { success: true };
}

export async function removePurchaseOrderItem(formData: FormData) {
  const session = await requireAdmin();
  const itemId = String(formData.get("itemId"));
  const item = await prisma.purchaseOrderItem.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found" };

  const po = await prisma.purchaseOrder.findUnique({ where: { id: item.purchaseOrderId } });
  if (!po || po.status !== "draft") return { error: "Can only remove items from draft POs" };

  await prisma.purchaseOrderItem.delete({ where: { id: itemId } });

  const items = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });
  const total = computePoTotal(items.map((i) => ({ orderedQty: i.orderedQty, unitCost: Number(i.unitCost) })));
  await prisma.purchaseOrder.update({ where: { id: po.id }, data: { totalAmount: total } });

  await logAudit({ entityType: "PurchaseOrder", entityId: po.id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/purchases/${po.id}`);
  return { success: true };
}

export async function updatePurchaseOrderStatus(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const newStatus = String(formData.get("status")) as "confirmed" | "cancelled";

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) return { error: "Not found" };

  const validTransitions: Record<string, string[]> = {
    draft: ["confirmed", "cancelled"],
    confirmed: ["cancelled"],
    partial: ["cancelled"],
  };
  if (!validTransitions[po.status]?.includes(newStatus)) {
    return { error: `Cannot transition from ${po.status} to ${newStatus}` };
  }

  await prisma.purchaseOrder.update({ where: { id }, data: { status: newStatus } });
  await logAudit({ entityType: "PurchaseOrder", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/purchases/${id}`);
  revalidatePath("/purchases");
  return { success: true };
}

export async function deletePurchaseOrder(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { _count: { select: { goodsReceipts: true } } } });
  if (!po) return { error: "Not found" };
  if (po.status !== "draft") return { error: "Only draft POs can be deleted" };
  if (po._count.goodsReceipts > 0) return { error: "Cannot delete: goods receipts linked to this PO" };
  await prisma.purchaseOrder.delete({ where: { id } });
  await logAudit({ entityType: "PurchaseOrder", entityId: id, action: "delete", actorId: session.id, actorName: session.displayName });
  revalidatePath("/purchases");
  redirect("/purchases");
}
