"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { goodsReceiptSchema, goodsReceiptItemSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";

async function requireStaff() {
  const session = await requireSession();
  if (!getPermissions(session.role).canReceiveGoods) throw new Error("Forbidden");
  return session;
}

export async function createGoodsReceipt(formData: FormData) {
  const session = await requireStaff();
  const parsed = goodsReceiptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const po = await prisma.purchaseOrder.findUnique({ where: { id: parsed.data.purchaseOrderId } });
  if (!po) return { error: "Purchase order not found" };
  if (!["confirmed", "partial"].includes(po.status)) return { error: "PO must be confirmed to create a GRN" };

  const grn = await prisma.goodsReceipt.create({
    data: {
      grnNumber: parsed.data.grnNumber,
      purchaseOrderId: parsed.data.purchaseOrderId,
      warehouseId: parsed.data.warehouseId,
      receiptDate: parsed.data.receiptDate,
      notes: parsed.data.notes,
      status: "draft",
    },
  });

  await logAudit({ entityType: "GoodsReceipt", entityId: grn.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/receipts");
  redirect(`/receipts/${grn.id}`);
}

export async function addGoodsReceiptItem(formData: FormData) {
  const session = await requireStaff();
  const parsed = goodsReceiptItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const grn = await prisma.goodsReceipt.findUnique({ where: { id: parsed.data.goodsReceiptId } });
  if (!grn) return { error: "GRN not found" };
  if (grn.status !== "draft") return { error: "Cannot edit a posted GRN" };

  await prisma.goodsReceiptItem.create({ data: parsed.data });
  revalidatePath(`/receipts/${grn.id}`);
  return { success: true };
}

export async function removeGoodsReceiptItem(formData: FormData) {
  const session = await requireStaff();
  const itemId = String(formData.get("itemId"));
  const item = await prisma.goodsReceiptItem.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found" };
  const grn = await prisma.goodsReceipt.findUnique({ where: { id: item.goodsReceiptId } });
  if (!grn || grn.status !== "draft") return { error: "Cannot edit a posted GRN" };
  await prisma.goodsReceiptItem.delete({ where: { id: itemId } });
  revalidatePath(`/receipts/${grn.id}`);
  return { success: true };
}

export async function postGoodsReceipt(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));

  const grn = await prisma.goodsReceipt.findUnique({
    where: { id },
    include: { items: { include: { productVariant: true } } },
  });
  if (!grn) return { error: "GRN not found" };
  if (grn.status !== "draft") return { error: "GRN is already posted" };
  if (grn.items.length === 0) return { error: "Cannot post an empty GRN. Add items first." };

  await prisma.$transaction(async (tx) => {
    // 1. Create stock ledger entries for each item
    for (const item of grn.items) {
      await tx.stockLedger.create({
        data: {
          productVariantId: item.productVariantId,
          warehouseId: grn.warehouseId,
          movementType: "purchase_in",
          quantity: item.receivedQty,
          unitCost: item.unitCost,
          referenceType: "goodsReceipt",
          referenceId: grn.id,
          notes: `GRN: ${grn.grnNumber}`,
          movedAt: grn.receiptDate,
        },
      });

      // 2. Update PO item received qty
      await tx.purchaseOrderItem.updateMany({
        where: {
          purchaseOrderId: grn.purchaseOrderId,
          productVariantId: item.productVariantId,
        },
        data: { receivedQty: { increment: item.receivedQty } },
      });

      // 3. Update product cost price to latest received cost
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: { costPrice: item.unitCost },
      });
    }

    // 4. Post the GRN
    await tx.goodsReceipt.update({ where: { id }, data: { status: "posted" } });

    // 5. Check PO completion and update status
    const poItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: grn.purchaseOrderId },
    });
    const allReceived = poItems.every((i) => i.receivedQty >= i.orderedQty);
    const anyReceived = poItems.some((i) => i.receivedQty > 0);

    if (allReceived) {
      await tx.purchaseOrder.update({ where: { id: grn.purchaseOrderId }, data: { status: "received" } });
    } else if (anyReceived) {
      await tx.purchaseOrder.update({ where: { id: grn.purchaseOrderId }, data: { status: "partial" } });
    }
  });

  await logAudit({ entityType: "GoodsReceipt", entityId: id, action: "post", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/receipts/${id}`);
  revalidatePath("/receipts");
  revalidatePath("/purchases");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGoodsReceipt(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const grn = await prisma.goodsReceipt.findUnique({ where: { id } });
  if (!grn) return { error: "Not found" };
  if (grn.status !== "draft") return { error: "Cannot delete a posted GRN" };
  await prisma.goodsReceipt.delete({ where: { id } });
  await logAudit({ entityType: "GoodsReceipt", entityId: id, action: "delete", actorId: session.id, actorName: session.displayName });
  revalidatePath("/receipts");
  redirect("/receipts");
}
