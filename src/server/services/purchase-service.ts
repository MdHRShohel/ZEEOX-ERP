import { prisma } from "@/lib/prisma";
import { PurchaseOrderStatus } from "@prisma/client";

export async function getPurchaseOrders(filters?: {
  search?: string;
  status?: string;
  supplierId?: string;
  page?: number;
}) {
  const { search, status, supplierId } = filters ?? {};
  return prisma.purchaseOrder.findMany({
    where: {
      ...(status ? { status: status as PurchaseOrderStatus } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(search
        ? {
            OR: [
              { poNumber: { contains: search, mode: "insensitive" } },
              { supplier: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { supplier: true, warehouse: true, _count: { select: { items: true, goodsReceipts: true } } },
    orderBy: { orderDate: "desc" },
  });
}

export async function getPurchaseOrderDetail(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          productVariant: { include: { uom: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      goodsReceipts: {
        orderBy: { receiptDate: "desc" },
        include: { warehouse: true },
      },
    },
  });
}

export async function getPurchaseOrderDropdownList() {
  return prisma.purchaseOrder.findMany({
    where: { status: { in: ["confirmed", "partial"] } },
    select: { id: true, poNumber: true, supplier: { select: { name: true } } },
    orderBy: { orderDate: "desc" },
  });
}

export async function getPurchaseStats() {
  const [total, draft, confirmed, totalValue] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({ where: { status: "draft" } }),
    prisma.purchaseOrder.count({ where: { status: "confirmed" } }),
    prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true } }),
  ]);
  return {
    total,
    draft,
    confirmed,
    totalValue: Number(totalValue._sum.totalAmount ?? 0),
  };
}
