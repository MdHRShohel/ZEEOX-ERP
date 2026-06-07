import { prisma } from "@/lib/prisma";
import { SalesOrderStatus, InvoiceStatus } from "@prisma/client";

// ─── Sales Orders ─────────────────────────────────────────────────────────────

export async function getSalesOrders(filters?: {
  search?: string;
  status?: string;
  customerId?: string;
}) {
  const { search, status, customerId } = filters ?? {};
  return prisma.salesOrder.findMany({
    where: {
      ...(status ? { status: status as SalesOrderStatus } : {}),
      ...(customerId ? { customerId } : {}),
      ...(search
        ? {
            OR: [
              { orderNo: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { customer: true, _count: { select: { items: true, invoices: true } } },
    orderBy: { orderDate: "desc" },
  });
}

export async function getSalesOrderDetail(id: string) {
  return prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: { productVariant: { include: { uom: true } } },
        orderBy: { createdAt: "asc" },
      },
      invoices: {
        orderBy: { invoiceDate: "desc" },
        include: { customer: true },
      },
    },
  });
}

export async function getSalesOrderDropdownList() {
  return prisma.salesOrder.findMany({
    where: { status: { in: ["confirmed"] } },
    select: { id: true, orderNo: true, customer: { select: { name: true } } },
    orderBy: { orderDate: "desc" },
  });
}

export async function getSalesOrderStats() {
  const [total, draft, confirmed] = await Promise.all([
    prisma.salesOrder.count(),
    prisma.salesOrder.count({ where: { status: "draft" } }),
    prisma.salesOrder.count({ where: { status: "confirmed" } }),
  ]);
  const totalValue = await prisma.salesOrder.aggregate({ _sum: { totalAmount: true } });
  return { total, draft, confirmed, totalValue: Number(totalValue._sum.totalAmount ?? 0) };
}

// ─── Sales Invoices ───────────────────────────────────────────────────────────

export async function getSalesInvoices(filters?: {
  search?: string;
  status?: string;
  customerId?: string;
}) {
  const { search, status, customerId } = filters ?? {};
  return prisma.salesInvoice.findMany({
    where: {
      ...(status ? { status: status as InvoiceStatus } : {}),
      ...(customerId ? { customerId } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNo: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { customer: true, _count: { select: { items: true } } },
    orderBy: { invoiceDate: "desc" },
  });
}

export async function getSalesInvoiceDetail(id: string) {
  return prisma.salesInvoice.findUnique({
    where: { id },
    include: {
      customer: true,
      salesOrder: true,
      items: {
        include: { productVariant: { include: { uom: true } } },
        orderBy: { createdAt: "asc" },
      },
      returns: {
        include: { _count: { select: { items: true } } },
        orderBy: { returnDate: "desc" },
      },
    },
  });
}

export async function getInvoiceStats() {
  const [total, unpaid] = await Promise.all([
    prisma.salesInvoice.count(),
    prisma.salesInvoice.count({ where: { status: { in: ["unpaid", "partial"] } } }),
  ]);
  const revenue = await prisma.salesInvoice.aggregate({
    _sum: { totalAmount: true, paidAmount: true },
    where: { status: { notIn: ["cancelled"] } },
  });
  const grossProfit = await prisma.salesInvoiceItem.aggregate({
    _sum: { lineTotal: true, costPrice: true, quantity: true },
  });
  const totalRevenue = Number(revenue._sum.totalAmount ?? 0);
  const totalCOGS = (grossProfit._sum.quantity ?? 0) * 0; // computed per item below
  return {
    total,
    unpaid,
    totalRevenue,
    totalPaid: Number(revenue._sum.paidAmount ?? 0),
  };
}
