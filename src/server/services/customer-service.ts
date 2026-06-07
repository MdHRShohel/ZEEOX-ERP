import { prisma } from "@/lib/prisma";

export async function getCustomers(filters?: { search?: string }) {
  const { search } = filters ?? {};
  return prisma.customer.findMany({
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
    include: { _count: { select: { salesInvoices: true, salesOrders: true } } },
  });
}

export async function getCustomerDropdownList() {
  return prisma.customer.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerDetail(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      salesInvoices: {
        orderBy: { invoiceDate: "desc" },
        take: 10,
      },
    },
  });
}

export async function getCustomerStats() {
  const [total, active] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { isActive: true } }),
  ]);
  return { total, active };
}
