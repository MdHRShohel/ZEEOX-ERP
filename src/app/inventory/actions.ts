"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasInventoryDatabase } from "@/server/services/inventory-service";
import { logAuditEvent } from "@/server/services/audit-service";
import { canManageScope, getSessionUser } from "@/lib/auth";

function requireDatabase() {
  if (!hasInventoryDatabase()) {
    throw new Error("DATABASE_URL is required to create inventory records.");
  }
}

async function requireInventoryAccess() {
  const user = await getSessionUser();
  if (!user || !canManageScope(user.role, "inventory")) {
    throw new Error("You do not have permission to manage inventory records.");
  }
}

export async function createProductCategory(formData: FormData) {
  await requireInventoryAccess();
  requireDatabase();
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) throw new Error("Category name is required");

  const category = await prisma.productCategory.create({
    data: { name: name.trim() }
  });

  await logAuditEvent({ entity: "productCategory", action: "create", payload: category });
  revalidatePath("/inventory");
}

export async function createProductVariant(formData: FormData) {
  await requireInventoryAccess();
  requireDatabase();

  const categoryId = formData.get("categoryId");
  const model = formData.get("model");
  const color = formData.get("color");
  const size = formData.get("size");
  const sku = formData.get("sku");
  const openingStock = Number(formData.get("openingStock"));
  const reorderLevel = Number(formData.get("reorderLevel"));

  if (typeof categoryId !== "string" || !categoryId.trim()) throw new Error("Category is required");
  if (typeof model !== "string" || !model.trim()) throw new Error("Model is required");
  if (!Number.isFinite(openingStock) || openingStock < 0) throw new Error("Opening stock must be zero or more");
  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) throw new Error("Reorder level must be zero or more");

  const variant = await prisma.productVariant.create({
    data: {
      categoryId: categoryId.trim(),
      model: model.trim(),
      color: typeof color === "string" && color.trim() ? color.trim() : null,
      size: typeof size === "string" && size.trim() ? size.trim() : null,
      sku: typeof sku === "string" && sku.trim() ? sku.trim() : null,
      openingStock,
      reorderLevel
    }
  });

  await logAuditEvent({ entity: "productVariant", action: "create", payload: variant });
  revalidatePath("/inventory");
}

export async function updateProductCategory(formData: FormData) {
  await requireInventoryAccess();
  requireDatabase();

  const id = formData.get("id");
  const name = formData.get("name");

  if (typeof id !== "string" || !id.trim()) throw new Error("Category ID is required");
  if (typeof name !== "string" || !name.trim()) throw new Error("Category name is required");

  const category = await prisma.productCategory.update({
    where: { id: id.trim() },
    data: { name: name.trim() }
  });

  await logAuditEvent({ entity: "productCategory", action: "update", payload: category });
  revalidatePath("/inventory");
}

export async function deleteProductCategory(formData: FormData) {
  await requireInventoryAccess();
  requireDatabase();

  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Category ID is required");

  const linkedVariants = await prisma.productVariant.count({
    where: { categoryId: id.trim() }
  });

  if (linkedVariants > 0) {
    throw new Error("Delete variants first before deleting this category");
  }

  const category = await prisma.productCategory.delete({
    where: { id: id.trim() }
  });

  await logAuditEvent({ entity: "productCategory", action: "delete", payload: category });
  revalidatePath("/inventory");
}

export async function updateProductVariant(formData: FormData) {
  await requireInventoryAccess();
  requireDatabase();

  const id = formData.get("id");
  const categoryId = formData.get("categoryId");
  const model = formData.get("model");
  const color = formData.get("color");
  const size = formData.get("size");
  const sku = formData.get("sku");
  const openingStock = Number(formData.get("openingStock"));
  const reorderLevel = Number(formData.get("reorderLevel"));

  if (typeof id !== "string" || !id.trim()) throw new Error("Variant ID is required");
  if (typeof categoryId !== "string" || !categoryId.trim()) throw new Error("Category is required");
  if (typeof model !== "string" || !model.trim()) throw new Error("Model is required");
  if (!Number.isFinite(openingStock) || openingStock < 0) throw new Error("Opening stock must be zero or more");
  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) throw new Error("Reorder level must be zero or more");

  const variant = await prisma.productVariant.update({
    where: { id: id.trim() },
    data: {
      categoryId: categoryId.trim(),
      model: model.trim(),
      color: typeof color === "string" && color.trim() ? color.trim() : null,
      size: typeof size === "string" && size.trim() ? size.trim() : null,
      sku: typeof sku === "string" && sku.trim() ? sku.trim() : null,
      openingStock,
      reorderLevel
    }
  });

  await logAuditEvent({ entity: "productVariant", action: "update", payload: variant });
  revalidatePath("/inventory");
}

export async function deleteProductVariant(formData: FormData) {
  await requireInventoryAccess();
  requireDatabase();

  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Variant ID is required");

  const linkedBatches = await prisma.productionBatch.count({
    where: { productVariantId: id.trim() }
  });
  const linkedLedger = await prisma.stockLedger.count({
    where: { productVariantId: id.trim() }
  });
  const linkedItems = await prisma.salesInvoiceItem.count({
    where: { productVariantId: id.trim() }
  });

  if (linkedBatches + linkedLedger + linkedItems > 0) {
    throw new Error("Delete related production, stock, and invoice records before deleting this variant");
  }

  const variant = await prisma.productVariant.delete({
    where: { id: id.trim() }
  });

  await logAuditEvent({ entity: "productVariant", action: "delete", payload: variant });
  revalidatePath("/inventory");
}
