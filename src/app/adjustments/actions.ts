"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { stockAdjustmentSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await requireSession();
  if (!getPermissions(session.role).canAdjustStock) throw new Error("Forbidden");
  return session;
}

export async function postStockAdjustment(formData: FormData) {
  const session = await requireAdmin();
  const parsed = stockAdjustmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const entry = await prisma.stockLedger.create({
    data: {
      productVariantId: parsed.data.productVariantId,
      warehouseId: parsed.data.warehouseId || undefined,
      movementType: "adjustment",
      quantity: parsed.data.quantity,
      unitCost: 0,
      notes: parsed.data.reason,
      movedAt: parsed.data.adjustedAt,
    },
  });

  await logAudit({
    entityType: "StockLedger",
    entityId: entry.id,
    action: "create",
    actorId: session.id,
    actorName: session.displayName,
    snapshot: { reason: parsed.data.reason, quantity: parsed.data.quantity },
  });

  revalidatePath("/adjustments");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true };
}
