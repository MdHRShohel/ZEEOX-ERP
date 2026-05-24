"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productionBatchSchema } from "@/lib/domain-schemas";
import { calculateProductionTotal } from "@/lib/calculations";
import { hasOperationsDatabase } from "@/server/services/operations-service";
import { logAuditEvent } from "@/server/services/audit-service";
import { canManageScope, getSessionUser } from "@/lib/auth";

function requireDatabase() {
  if (!hasOperationsDatabase()) {
    throw new Error("DATABASE_URL is required to create production records.");
  }
}

async function requireOperationsAccess() {
  const user = await getSessionUser();
  if (!user || !canManageScope(user.role, "operations")) {
    throw new Error("You do not have permission to manage production records.");
  }
}

export async function createProductionBatch(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const parsed = productionBatchSchema.safeParse({
    productVariantId: formData.get("productVariantId"),
    batchDate: formData.get("batchDate"),
    materialCost: Number(formData.get("materialCost")),
    laborCost: Number(formData.get("laborCost")),
    packagingCost: Number(formData.get("packagingCost")),
    otherCost: Number(formData.get("otherCost")),
    quantity: Number(formData.get("quantity"))
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid production batch");
  }

  const created = await prisma.productionBatch.create({ data: parsed.data });
  const totalCost = calculateProductionTotal({
    materialCost: Number(created.materialCost),
    laborCost: Number(created.laborCost),
    packagingCost: Number(created.packagingCost),
    otherCost: Number(created.otherCost)
  });

  await prisma.stockLedger.create({
    data: {
      productVariantId: created.productVariantId,
      movementType: "production_in",
      quantity: created.quantity,
      movementDate: created.batchDate,
      referenceType: "productionBatch",
      referenceId: created.id,
      note: `Production posted. Total cost: ${totalCost.toFixed(2)}`
    }
  });

  await logAuditEvent({ entity: "productionBatch", action: "create", payload: created });
  revalidatePath("/production");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}

export async function updateProductionBatch(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const id = formData.get("id");
  const parsed = productionBatchSchema.safeParse({
    productVariantId: formData.get("productVariantId"),
    batchDate: formData.get("batchDate"),
    materialCost: Number(formData.get("materialCost")),
    laborCost: Number(formData.get("laborCost")),
    packagingCost: Number(formData.get("packagingCost")),
    otherCost: Number(formData.get("otherCost")),
    quantity: Number(formData.get("quantity"))
  });

  if (typeof id !== "string" || !id.trim()) throw new Error("Batch ID is required");
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid production batch");

  const updated = await prisma.productionBatch.update({
    where: { id: id.trim() },
    data: parsed.data
  });

  await prisma.stockLedger.deleteMany({
    where: {
      referenceType: "productionBatch",
      referenceId: updated.id
    }
  });

  const totalCost = calculateProductionTotal({
    materialCost: Number(updated.materialCost),
    laborCost: Number(updated.laborCost),
    packagingCost: Number(updated.packagingCost),
    otherCost: Number(updated.otherCost)
  });

  await prisma.stockLedger.create({
    data: {
      productVariantId: updated.productVariantId,
      movementType: "production_in",
      quantity: updated.quantity,
      movementDate: updated.batchDate,
      referenceType: "productionBatch",
      referenceId: updated.id,
      note: `Production updated. Total cost: ${totalCost.toFixed(2)}`
    }
  });

  await logAuditEvent({ entity: "productionBatch", action: "update", payload: updated });
  revalidatePath("/production");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}

export async function deleteProductionBatch(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Batch ID is required");

  await prisma.stockLedger.deleteMany({
    where: {
      referenceType: "productionBatch",
      referenceId: id.trim()
    }
  });

  const batch = await prisma.productionBatch.delete({
    where: { id: id.trim() }
  });

  await logAuditEvent({ entity: "productionBatch", action: "delete", payload: batch });
  revalidatePath("/production");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}
