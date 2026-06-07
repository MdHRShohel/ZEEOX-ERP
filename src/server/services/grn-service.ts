import { prisma } from "@/lib/prisma";

export async function getGoodsReceipts(filters?: {
  search?: string;
  purchaseOrderId?: string;
  page?: number;
}) {
  const { search, purchaseOrderId } = filters ?? {};
  return prisma.goodsReceipt.findMany({
    where: {
      ...(purchaseOrderId ? { purchaseOrderId } : {}),
      ...(search
        ? {
            OR: [
              { grnNumber: { contains: search, mode: "insensitive" } },
              { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      purchaseOrder: { include: { supplier: true } },
      warehouse: true,
      _count: { select: { items: true } },
    },
    orderBy: { receiptDate: "desc" },
  });
}

export async function getGoodsReceiptDetail(id: string) {
  return prisma.goodsReceipt.findUnique({
    where: { id },
    include: {
      purchaseOrder: {
        include: {
          supplier: true,
          items: { include: { productVariant: { include: { uom: true } } } },
        },
      },
      warehouse: true,
      items: {
        include: { productVariant: { include: { uom: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getGrnStats() {
  const [total, posted] = await Promise.all([
    prisma.goodsReceipt.count(),
    prisma.goodsReceipt.count({ where: { status: "posted" } }),
  ]);
  const totalUnits = await prisma.goodsReceiptItem.aggregate({ _sum: { receivedQty: true } });
  return {
    total,
    posted,
    totalUnitsReceived: totalUnits._sum.receivedQty ?? 0,
  };
}
