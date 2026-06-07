import { prisma } from "@/lib/prisma";
import { computeCurrentStock } from "@/lib/calculations";
import { StockMovementType } from "@prisma/client";

export async function getUoms() {
  return prisma.unitOfMeasure.findMany({ orderBy: { name: "asc" } });
}

export async function getCategories() {
  return prisma.productCategory.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoriesWithCount() {
  return prisma.productCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { variants: true } } },
  });
}

export async function getProducts(filters?: { search?: string; categoryId?: string; page?: number }) {
  const { search, categoryId } = filters ?? {};
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { sku: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { category: true, uom: true },
    orderBy: { name: "asc" },
  });
  return variants;
}

export async function getProductsWithStock(filters?: { search?: string; categoryId?: string }) {
  const variants = await getProducts(filters);

  const ledgerRaw = await prisma.stockLedger.groupBy({
    by: ["productVariantId", "movementType"],
    _sum: { quantity: true },
  });

  const stockMap = new Map<string, number>();
  for (const row of ledgerRaw) {
    const current = stockMap.get(row.productVariantId) ?? 0;
    const qty = row._sum.quantity ?? 0;
    const movement = { movementType: row.movementType as StockMovementType, quantity: qty };
    const delta = computeCurrentStock([movement]);
    stockMap.set(row.productVariantId, current + delta);
  }

  return variants.map((v) => ({
    ...v,
    currentStock: stockMap.get(v.id) ?? 0,
  }));
}

export async function getProductDetail(id: string) {
  return prisma.productVariant.findUnique({
    where: { id },
    include: {
      category: true,
      uom: true,
      stockLedger: {
        orderBy: { movedAt: "desc" },
        take: 30,
        include: { warehouse: true },
      },
    },
  });
}

export async function getProductDropdownList() {
  return prisma.productVariant.findMany({
    where: { isActive: true },
    select: { id: true, sku: true, name: true, costPrice: true, salePrice: true, uom: { select: { abbreviation: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getProductStats() {
  const [total, active, categories, ledgerRaw] = await Promise.all([
    prisma.productVariant.count(),
    prisma.productVariant.count({ where: { isActive: true } }),
    prisma.productCategory.count(),
    prisma.stockLedger.groupBy({
      by: ["productVariantId", "movementType"],
      _sum: { quantity: true },
    }),
  ]);

  const stockMap = new Map<string, number>();
  for (const row of ledgerRaw) {
    const current = stockMap.get(row.productVariantId) ?? 0;
    const movement = { movementType: row.movementType as StockMovementType, quantity: row._sum.quantity ?? 0 };
    stockMap.set(row.productVariantId, current + computeCurrentStock([movement]));
  }

  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    select: { id: true, reorderLevel: true },
  });
  const lowStock = variants.filter((v) => {
    const stock = stockMap.get(v.id) ?? 0;
    return stock > 0 && stock <= v.reorderLevel;
  }).length;
  const outOfStock = variants.filter((v) => (stockMap.get(v.id) ?? 0) <= 0).length;

  return { total, active, categories, lowStock, outOfStock };
}
