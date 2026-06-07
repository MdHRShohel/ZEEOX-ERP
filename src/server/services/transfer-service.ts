import { prisma } from "@/lib/prisma";

export async function getTransfers(filters?: { page?: number }) {
  return prisma.stockTransfer.findMany({
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      _count: { select: { items: true } },
    },
    orderBy: { transferDate: "desc" },
  });
}

export async function getTransferDetail(id: string) {
  return prisma.stockTransfer.findUnique({
    where: { id },
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      items: {
        include: { productVariant: { include: { uom: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getTransferStats() {
  const total = await prisma.stockTransfer.count();
  const units = await prisma.stockTransferItem.aggregate({ _sum: { quantity: true } });
  return { total, totalUnits: units._sum.quantity ?? 0 };
}
