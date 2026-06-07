import { prisma } from "@/lib/prisma";
import { ReturnType } from "@prisma/client";

export async function getReturns(filters?: { type?: string }) {
  const { type } = filters ?? {};
  return prisma.return.findMany({
    where: type ? { type: type as ReturnType } : undefined,
    include: {
      salesInvoice: { include: { customer: true } },
      _count: { select: { items: true } },
    },
    orderBy: { returnDate: "desc" },
  });
}

export async function getReturnDetail(id: string) {
  return prisma.return.findUnique({
    where: { id },
    include: {
      salesInvoice: { include: { customer: true } },
      items: {
        include: { productVariant: { include: { uom: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getReturnStats() {
  const [total, customer, supplier] = await Promise.all([
    prisma.return.count(),
    prisma.return.count({ where: { type: "customer_return" } }),
    prisma.return.count({ where: { type: "supplier_return" } }),
  ]);
  const totalValue = await prisma.return.aggregate({ _sum: { totalAmount: true } });
  return { total, customer, supplier, totalValue: Number(totalValue._sum.totalAmount ?? 0) };
}
