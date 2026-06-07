"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { productVariantSchema, categorySchema, openingStockSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";

async function requireStaff() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageProducts) throw new Error("Forbidden");
  return session;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const session = await requireStaff();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const cat = await prisma.productCategory.create({ data: parsed.data });
  await logAudit({ entityType: "ProductCategory", entityId: cat.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/products");
  revalidatePath("/products/categories");
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.productCategory.update({ where: { id }, data: parsed.data });
  await logAudit({ entityType: "ProductCategory", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/products/categories");
  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const count = await prisma.productVariant.count({ where: { categoryId: id } });
  if (count > 0) return { error: `Cannot delete: ${count} product(s) belong to this category.` };
  await prisma.productCategory.delete({ where: { id } });
  await logAudit({ entityType: "ProductCategory", entityId: id, action: "delete", actorId: session.id, actorName: session.displayName });
  revalidatePath("/products/categories");
  return { success: true };
}

// ─── Variants ─────────────────────────────────────────────────────────────────

export async function createProduct(formData: FormData) {
  const session = await requireStaff();
  const parsed = productVariantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const variant = await prisma.productVariant.create({ data: parsed.data });
  await logAudit({ entityType: "ProductVariant", entityId: variant.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/products");
  return { success: true };
}

export async function updateProduct(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const parsed = productVariantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.productVariant.update({ where: { id }, data: parsed.data });
  await logAudit({ entityType: "ProductVariant", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const ledgerCount = await prisma.stockLedger.count({ where: { productVariantId: id } });
  if (ledgerCount > 0) return { error: "Cannot delete: product has stock movements. Deactivate it instead." };
  await prisma.productVariant.delete({ where: { id } });
  await logAudit({ entityType: "ProductVariant", entityId: id, action: "delete", actorId: session.id, actorName: session.displayName });
  revalidatePath("/products");
  return { success: true };
}

export async function postOpeningStock(formData: FormData) {
  const session = await requireStaff();
  const parsed = openingStockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const existing = await prisma.stockLedger.count({
    where: { productVariantId: parsed.data.productVariantId, movementType: "opening" },
  });
  if (existing > 0) return { error: "Opening stock already posted for this product." };
  const entry = await prisma.stockLedger.create({
    data: {
      productVariantId: parsed.data.productVariantId,
      warehouseId: parsed.data.warehouseId,
      movementType: "opening",
      quantity: parsed.data.quantity,
      unitCost: parsed.data.unitCost,
      notes: "Opening stock",
    },
  });
  await logAudit({ entityType: "StockLedger", entityId: entry.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/products");
  revalidatePath(`/products/${parsed.data.productVariantId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
