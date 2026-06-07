import { prisma } from "@/lib/prisma";

export async function getAdjustments(filters?: { variantId?: string; page?: number }) {
  const { variantId } = filters ?? {};
  return prisma.stockLedger.findMany({
    where: {
      movementType: "adjustment",
      ...(variantId ? { productVariantId: variantId } : {}),
    },
    include: {
      productVariant: { include: { uom: true } },
      warehouse: true,
    },
    orderBy: { movedAt: "desc" },
    take: 100,
  });
}
