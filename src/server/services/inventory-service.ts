import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export function hasInventoryDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getInventoryOverview(filters?: { search?: string }) {
  if (!hasInventoryDatabase()) {
    return {
      categories: [],
      variants: [],
      categoryCount: 0,
      variantCount: 0,
      openingStock: 0,
      reorderAlerts: 0
    };
  }

  const search = filters?.search?.trim();
  const categoryWhere: Prisma.ProductCategoryWhereInput | undefined = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          {
            variants: {
              some: {
                OR: [
                  { model: { contains: search, mode: "insensitive" } },
                  { sku: { contains: search, mode: "insensitive" } },
                  { color: { contains: search, mode: "insensitive" } },
                  { size: { contains: search, mode: "insensitive" } }
                ]
              }
            }
          }
        ]
      }
    : undefined;
  const variantWhere: Prisma.ProductVariantWhereInput | undefined = search
    ? {
        OR: [
          { model: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { color: { contains: search, mode: "insensitive" } },
          { size: { contains: search, mode: "insensitive" } },
          { category: { name: { contains: search, mode: "insensitive" } } }
        ]
      }
    : undefined;

  const [categories, variants] = await Promise.all([
    prisma.productCategory.findMany({
      orderBy: { name: "asc" },
      where: categoryWhere,
      include: {
        variants: {
          orderBy: { createdAt: "desc" }
        }
      }
    }),
    prisma.productVariant.findMany({
      orderBy: { createdAt: "desc" },
      where: variantWhere,
      include: {
        category: true
      }
    })
  ]);

  const openingStock = variants.reduce((sum, variant) => sum + variant.openingStock, 0);
  const reorderAlerts = variants.filter((variant) => variant.openingStock <= variant.reorderLevel).length;

  return {
    categories,
    variants,
    categoryCount: categories.length,
    variantCount: variants.length,
    openingStock,
    reorderAlerts
  };
}

export async function getProductCategories() {
  if (!hasInventoryDatabase()) return [];
  return prisma.productCategory.findMany({
    orderBy: { name: "asc" }
  });
}

export async function getProductVariants() {
  if (!hasInventoryDatabase()) return [];
  return prisma.productVariant.findMany({
    orderBy: { model: "asc" },
    include: {
      category: true
    }
  });
}
