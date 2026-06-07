import { prisma } from "@/lib/prisma";
import { computeCurrentStock } from "@/lib/calculations";
import { StockMovementType } from "@prisma/client";

export async function getInventoryValuationReport() {
  const [products, ledger] = await Promise.all([
    prisma.productVariant.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } }, uom: { select: { abbreviation: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.stockLedger.groupBy({
      by: ["productVariantId", "movementType"],
      _sum: { quantity: true },
    }),
  ]);

  return products.map((p) => {
    const movements = ledger
      .filter((l) => l.productVariantId === p.id)
      .map((l) => ({
        movementType: l.movementType as StockMovementType,
        quantity: l._sum.quantity ?? 0,
      }));
    const currentStock = computeCurrentStock(movements);
    const costPrice = Number(p.costPrice);
    return {
      variantId: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      uom: p.uom.abbreviation,
      currentStock,
      costPrice,
      totalValue: Math.round(currentStock * costPrice * 100) / 100,
    };
  });
}

export async function getLowStockReport() {
  const report = await getInventoryValuationReport();
  const products = await prisma.productVariant.findMany({
    where: { isActive: true },
    select: { id: true, reorderLevel: true },
  });

  const reorderMap = new Map(products.map((p) => [p.id, p.reorderLevel]));
  return report
    .filter((p) => p.currentStock <= (reorderMap.get(p.variantId) ?? 0))
    .map((p) => ({
      ...p,
      reorderLevel: reorderMap.get(p.variantId) ?? 0,
      deficit: (reorderMap.get(p.variantId) ?? 0) - p.currentStock,
    }))
    .sort((a, b) => a.currentStock - b.currentStock);
}

export async function getStockMovementReport(filters?: {
  variantId?: string;
  warehouseId?: string;
  movementType?: string;
  from?: string;
  to?: string;
  page?: number;
}) {
  const { variantId, warehouseId, movementType, from, to, page = 1 } = filters ?? {};
  const take = 50;
  const skip = (page - 1) * take;

  const where = {
    ...(variantId ? { productVariantId: variantId } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(movementType ? { movementType: movementType as StockMovementType } : {}),
    ...(from || to
      ? {
          movedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [movements, total] = await Promise.all([
    prisma.stockLedger.findMany({
      where,
      include: {
        productVariant: { select: { sku: true, name: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { movedAt: "desc" },
      take,
      skip,
    }),
    prisma.stockLedger.count({ where }),
  ]);

  return { movements, total, page, pages: Math.ceil(total / take) };
}

export async function getProfitabilityReport(filters?: { from?: string; to?: string }) {
  const { from, to } = filters ?? {};
  const dateFilter = from || to ? {
    salesInvoice: {
      invoiceDate: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
      status: { notIn: ["cancelled" as const] },
    },
  } : { salesInvoice: { status: { notIn: ["cancelled" as const] } } };

  const items = await prisma.salesInvoiceItem.groupBy({
    by: ["productVariantId"],
    _sum: { quantity: true, lineTotal: true },
    where: dateFilter,
  });

  const variantIds = items.map((i) => i.productVariantId);
  const [variants, costItems] = await Promise.all([
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { category: { select: { name: true } } },
    }),
    prisma.salesInvoiceItem.groupBy({
      by: ["productVariantId"],
      _sum: { costPrice: true, quantity: true },
      where: dateFilter,
    }),
  ]);

  const costMap = new Map(
    costItems.map((c) => [
      c.productVariantId,
      (c._sum.quantity ?? 0) * Number(c._sum.costPrice ?? 0),
    ])
  );

  return items
    .map((item) => {
      const variant = variants.find((v) => v.id === item.productVariantId);
      if (!variant) return null;
      const revenue = Number(item._sum.lineTotal ?? 0);
      const cogs = costMap.get(item.productVariantId) ?? 0;
      const grossProfit = revenue - cogs;
      const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      return {
        sku: variant.sku,
        name: variant.name,
        unitsSold: item._sum.quantity ?? 0,
        revenue: Math.round(revenue * 100) / 100,
        cogs: Math.round(cogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        marginPct: Math.round(marginPct * 10) / 10,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.grossProfit ?? 0) - (a?.grossProfit ?? 0));
}

export async function getPurchaseSummaryReport(filters?: { from?: string; to?: string; supplierId?: string }) {
  const { from, to, supplierId } = filters ?? {};
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      ...(supplierId ? { supplierId } : {}),
      ...(from || to
        ? { orderDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
    include: { supplier: { select: { name: true } } },
    orderBy: { orderDate: "desc" },
  });

  return orders.map((o) => ({
    poNumber: o.poNumber,
    supplier: o.supplier.name,
    orderDate: o.orderDate.toISOString().slice(0, 10),
    totalAmount: Number(o.totalAmount),
    status: o.status,
  }));
}
