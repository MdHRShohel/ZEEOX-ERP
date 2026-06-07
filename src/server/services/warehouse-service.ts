import { prisma } from "@/lib/prisma";

export async function getWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { purchaseOrders: true, goodsReceipts: true } } },
  });
}

export async function getWarehouseDropdownList() {
  return prisma.warehouse.findMany({
    where: { isActive: true },
    select: { id: true, name: true, isDefault: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getDefaultWarehouse() {
  return prisma.warehouse.findFirst({ where: { isDefault: true } });
}

export async function getWarehouseStats() {
  const [total, active, defaultWh] = await Promise.all([
    prisma.warehouse.count(),
    prisma.warehouse.count({ where: { isActive: true } }),
    prisma.warehouse.findFirst({ where: { isDefault: true }, select: { name: true } }),
  ]);
  return { total, active, defaultName: defaultWh?.name ?? "None set" };
}
