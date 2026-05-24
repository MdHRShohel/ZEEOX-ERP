import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { courierStatuses, paymentStatuses } from "@/lib/constants";

export function hasOperationsDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getProductionOverview(filters?: { search?: string; from?: Date; to?: Date }) {
  if (!hasOperationsDatabase()) {
    return { batches: [], batchCount: 0, quantityTotal: 0, costTotal: 0 };
  }

  const search = filters?.search?.trim();
  const batchDate = filters?.from || filters?.to ? { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } : undefined;
  const where: Prisma.ProductionBatchWhereInput | undefined = {
    ...(batchDate ? { batchDate } : {}),
    ...(search
      ? {
          OR: [
            { note: { contains: search, mode: "insensitive" } },
            { productVariant: { model: { contains: search, mode: "insensitive" } } },
            { productVariant: { sku: { contains: search, mode: "insensitive" } } },
            { productVariant: { category: { name: { contains: search, mode: "insensitive" } } } }
          ]
        }
      : {})
  };

  const [batches, summary] = await Promise.all([
    prisma.productionBatch.findMany({
      orderBy: { createdAt: "desc" },
      where,
      include: {
        productVariant: {
          include: {
            category: true
          }
        }
      }
    }),
    prisma.productionBatch.aggregate({
      _sum: {
        quantity: true,
        materialCost: true,
        laborCost: true,
        packagingCost: true,
        otherCost: true
      }
    })
  ]);

  return {
    batches,
    batchCount: batches.length,
    quantityTotal: Number(summary._sum.quantity ?? 0),
    costTotal:
      Number(summary._sum.materialCost ?? 0) +
      Number(summary._sum.laborCost ?? 0) +
      Number(summary._sum.packagingCost ?? 0) +
      Number(summary._sum.otherCost ?? 0)
  };
}

export async function getSalesOverview(filters?: { search?: string; status?: string; from?: Date; to?: Date }) {
  if (!hasOperationsDatabase()) {
    return { invoices: [], invoiceCount: 0, totalSale: 0, totalCost: 0, netProfit: 0 };
  }

  const search = filters?.search?.trim();
  const invoiceDate = filters?.from || filters?.to ? { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } : undefined;
  const where: Prisma.SalesInvoiceWhereInput | undefined = {
    ...(filters?.status && paymentStatuses.includes(filters.status as (typeof paymentStatuses)[number]) ? { paymentStatus: filters.status as (typeof paymentStatuses)[number] } : {}),
    ...(invoiceDate ? { invoiceDate } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNo: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
            { items: { some: { productVariant: { model: { contains: search, mode: "insensitive" } } } } }
          ]
        }
      : {})
  };

  const [invoices, summary] = await Promise.all([
    prisma.salesInvoice.findMany({
      orderBy: { createdAt: "desc" },
      where,
      include: {
        customer: true,
        items: {
          include: {
            productVariant: {
              include: {
                category: true
              }
            }
          }
        },
        shipment: true
      }
    }),
    prisma.salesInvoice.aggregate({
      _sum: {
        totalSale: true,
        totalCost: true,
        netProfit: true
      }
    })
  ]);

  return {
    invoices,
    invoiceCount: invoices.length,
    totalSale: Number(summary._sum.totalSale ?? 0),
    totalCost: Number(summary._sum.totalCost ?? 0),
    netProfit: Number(summary._sum.netProfit ?? 0)
  };
}

export async function getSalesInvoiceDetail(invoiceId: string) {
  if (!hasOperationsDatabase()) {
    return null;
  }

  return prisma.salesInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      items: {
        include: {
          productVariant: {
            include: {
              category: true
            }
          }
        }
      },
      shipment: true
    }
  });
}

export async function getCourierOverview(filters?: { search?: string; status?: string; from?: Date; to?: Date }) {
  if (!hasOperationsDatabase()) {
    return { shipments: [], shipmentCount: 0, deliveredCount: 0, returnCount: 0, courierCost: 0 };
  }

  const search = filters?.search?.trim();
  const shipmentDate = filters?.from || filters?.to ? { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } : undefined;
  const where: Prisma.CourierShipmentWhereInput | undefined = {
    ...(filters?.status && courierStatuses.includes(filters.status as (typeof courierStatuses)[number]) ? { status: filters.status as (typeof courierStatuses)[number] } : {}),
    ...(shipmentDate ? { shipmentDate } : {}),
    ...(search
      ? {
          OR: [
            { courierName: { contains: search, mode: "insensitive" } },
            { trackingId: { contains: search, mode: "insensitive" } },
            { salesInvoice: { invoiceNo: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [shipments, summary] = await Promise.all([
    prisma.courierShipment.findMany({
      orderBy: { createdAt: "desc" },
      where,
      include: {
        salesInvoice: {
          include: {
            customer: true
          }
        }
      }
    }),
    prisma.courierShipment.aggregate({
      _sum: {
        deliveryCharge: true,
        codCharge: true,
        returnCharge: true
      }
    })
  ]);

  return {
    shipments,
    shipmentCount: shipments.length,
    deliveredCount: shipments.filter((shipment) => shipment.status === "delivered").length,
    returnCount: shipments.filter((shipment) => shipment.status === "returned").length,
    courierCost:
      Number(summary._sum.deliveryCharge ?? 0) +
      Number(summary._sum.codCharge ?? 0) +
      Number(summary._sum.returnCharge ?? 0)
  };
}

export async function getSalesInvoices() {
  if (!hasOperationsDatabase()) return [];
  return prisma.salesInvoice.findMany({
    orderBy: { invoiceNo: "desc" },
    include: {
      customer: true
    }
  });
}
