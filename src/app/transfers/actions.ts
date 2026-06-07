"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { stockTransferSchema, stockTransferItemSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";

async function requireStaff() {
  const session = await requireSession();
  if (!getPermissions(session.role).canTransferStock) throw new Error("Forbidden");
  return session;
}

export async function createStockTransfer(formData: FormData) {
  const session = await requireStaff();
  const parsed = stockTransferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.fromWarehouseId === parsed.data.toWarehouseId) {
    return { error: "Source and destination warehouses must be different" };
  }

  const transfer = await prisma.stockTransfer.create({
    data: { ...parsed.data, status: "draft" },
  });

  await logAudit({ entityType: "StockTransfer", entityId: transfer.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/transfers");
  redirect(`/transfers/${transfer.id}`);
}

export async function addTransferItem(formData: FormData) {
  const session = await requireStaff();
  const parsed = stockTransferItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const transfer = await prisma.stockTransfer.findUnique({ where: { id: parsed.data.stockTransferId } });
  if (!transfer || transfer.status !== "draft") return { error: "Cannot edit a posted transfer" };

  await prisma.stockTransferItem.create({ data: parsed.data });
  revalidatePath(`/transfers/${transfer.id}`);
  return { success: true };
}

export async function postStockTransfer(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));

  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!transfer) return { error: "Transfer not found" };
  if (transfer.status !== "draft") return { error: "Transfer is already posted" };
  if (transfer.items.length === 0) return { error: "Cannot post an empty transfer. Add items first." };

  await prisma.$transaction(async (tx) => {
    for (const item of transfer.items) {
      // Transfer out from source warehouse
      await tx.stockLedger.create({
        data: {
          productVariantId: item.productVariantId,
          warehouseId: transfer.fromWarehouseId,
          movementType: "transfer_out",
          quantity: item.quantity,
          unitCost: 0,
          referenceType: "stockTransfer",
          referenceId: transfer.id,
          notes: `Transfer ${transfer.transferNo}: to ${transfer.toWarehouseId}`,
          movedAt: transfer.transferDate,
        },
      });

      // Transfer in to destination warehouse
      await tx.stockLedger.create({
        data: {
          productVariantId: item.productVariantId,
          warehouseId: transfer.toWarehouseId,
          movementType: "transfer_in",
          quantity: item.quantity,
          unitCost: 0,
          referenceType: "stockTransfer",
          referenceId: transfer.id,
          notes: `Transfer ${transfer.transferNo}: from ${transfer.fromWarehouseId}`,
          movedAt: transfer.transferDate,
        },
      });
    }

    await tx.stockTransfer.update({ where: { id }, data: { status: "posted" } });
  });

  await logAudit({ entityType: "StockTransfer", entityId: id, action: "post", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/transfers/${id}`);
  revalidatePath("/transfers");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true };
}
