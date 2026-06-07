import { prisma } from "@/lib/prisma";

export async function getSuppliers(filters?: { search?: string }) {
  const { search } = filters ?? {};
  return prisma.supplier.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contactName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { purchaseOrders: true } } },
  });
}

export async function getSupplierDropdownList() {
  return prisma.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getSupplierDetail(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { orderDate: "desc" },
        take: 10,
        include: { warehouse: true },
      },
    },
  });
}

export async function getSupplierStats() {
  const [total, active] = await Promise.all([
    prisma.supplier.count(),
    prisma.supplier.count({ where: { isActive: true } }),
  ]);
  return { total, active };
}
