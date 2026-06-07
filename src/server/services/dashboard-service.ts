import { prisma } from "@/lib/prisma";
import { computeCurrentStock } from "@/lib/calculations";
import { StockMovementType } from "@prisma/client";

export async function getDashboardKPIs() {
  const [revenueAgg, purchaseAgg, products, pendingPOs, unpaidInvoices] = await Promise.all([
    prisma.salesInvoice.aggregate({
      _sum: { totalAmount: true, paidAmount: true },
      where: { status: { notIn: ["cancelled"] } },
    }),
    prisma.goodsReceipt.findMany({
      where: { status: "posted" },
      include: { items: true },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      select: { id: true, costPrice: true, reorderLevel: true },
    }),
    prisma.purchaseOrder.count({ where: { status: { in: ["draft", "confirmed"] } } }),
    prisma.salesInvoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["unpaid", "partial"] } },
    }),
  ]);

  // Gross profit from invoice items
  const profitAgg = await prisma.salesInvoiceItem.findMany({
    select: { quantity: true, unitPrice: true, costPrice: true },
  });
  const grossProfit = profitAgg.reduce(
    (sum, item) => sum + item.quantity * (Number(item.unitPrice) - Number(item.costPrice)),
    0
  );
  const totalRevenue = Number(revenueAgg._sum.totalAmount ?? 0);
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Stock value + low/out-of-stock counts
  const ledger = await prisma.stockLedger.groupBy({
    by: ["productVariantId", "movementType"],
    _sum: { quantity: true },
  });

  let stockValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const product of products) {
    const movements = ledger
      .filter((l) => l.productVariantId === product.id)
      .map((l) => ({
        movementType: l.movementType as StockMovementType,
        quantity: l._sum.quantity ?? 0,
      }));
    const currentStock = computeCurrentStock(movements);
    stockValue += currentStock * Number(product.costPrice);
    if (currentStock <= 0) outOfStockCount++;
    else if (currentStock <= product.reorderLevel) lowStockCount++;
  }

  return {
    totalRevenue,
    grossProfit,
    grossMarginPct: Math.round(grossMarginPct * 10) / 10,
    totalPaid: Number(revenueAgg._sum.paidAmount ?? 0),
    stockValue: Math.round(stockValue * 100) / 100,
    lowStockCount,
    outOfStockCount,
    pendingPOs,
    unpaidValue: Number(unpaidInvoices._sum.totalAmount ?? 0),
  };
}

export async function getRevenueTrend(): Promise<{ period: string; revenue: number; profit: number }[]> {
  // Last 8 months
  const invoices = await prisma.salesInvoice.findMany({
    where: {
      status: { notIn: ["cancelled"] },
      invoiceDate: { gte: new Date(new Date().setMonth(new Date().getMonth() - 7)) },
    },
    include: { items: { select: { quantity: true, unitPrice: true, costPrice: true } } },
    orderBy: { invoiceDate: "asc" },
  });

  const byMonth: Record<string, { revenue: number; profit: number }> = {};
  for (const inv of invoices) {
    const key = inv.invoiceDate.toISOString().slice(0, 7); // "2025-01"
    if (!byMonth[key]) byMonth[key] = { revenue: 0, profit: 0 };
    const rev = Number(inv.totalAmount);
    const prof = inv.items.reduce(
      (s, i) => s + i.quantity * (Number(i.unitPrice) - Number(i.costPrice)),
      0
    );
    byMonth[key].revenue += rev;
    byMonth[key].profit += prof;
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
    }));
}

export async function getTopProductsByRevenue(limit = 8): Promise<{ name: string; revenue: number }[]> {
  const items = await prisma.salesInvoiceItem.groupBy({
    by: ["productVariantId"],
    _sum: { lineTotal: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: limit,
  });

  const variantIds = items.map((i) => i.productVariantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, name: true },
  });

  return items.map((item) => ({
    name: variants.find((v) => v.id === item.productVariantId)?.name ?? "Unknown",
    revenue: Number(item._sum.lineTotal ?? 0),
  }));
}

export async function getStockStatusDistribution(): Promise<{ label: string; count: number; color: string }[]> {
  const products = await prisma.productVariant.findMany({
    where: { isActive: true },
    select: { id: true, reorderLevel: true },
  });

  const ledger = await prisma.stockLedger.groupBy({
    by: ["productVariantId", "movementType"],
    _sum: { quantity: true },
  });

  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const product of products) {
    const movements = ledger
      .filter((l) => l.productVariantId === product.id)
      .map((l) => ({
        movementType: l.movementType as StockMovementType,
        quantity: l._sum.quantity ?? 0,
      }));
    const current = computeCurrentStock(movements);
    if (current <= 0) outOfStock++;
    else if (current <= product.reorderLevel) lowStock++;
    else inStock++;
  }

  return [
    { label: "In Stock", count: inStock, color: "#22c55e" },
    { label: "Low Stock", count: lowStock, color: "#f59e0b" },
    { label: "Out of Stock", count: outOfStock, color: "#ef4444" },
  ];
}

export async function getPurchaseVsSalesTrend(): Promise<{ period: string; purchased: number; sold: number }[]> {
  const since = new Date(new Date().setMonth(new Date().getMonth() - 7));
  const ledgerEntries = await prisma.stockLedger.findMany({
    where: {
      movementType: { in: ["purchase_in", "sale_out"] },
      movedAt: { gte: since },
    },
    select: { movementType: true, quantity: true, unitCost: true, movedAt: true },
    orderBy: { movedAt: "asc" },
  });

  const byMonth: Record<string, { purchased: number; sold: number }> = {};
  for (const entry of ledgerEntries) {
    const key = entry.movedAt.toISOString().slice(0, 7);
    if (!byMonth[key]) byMonth[key] = { purchased: 0, sold: 0 };
    const value = entry.quantity * Number(entry.unitCost);
    if (entry.movementType === "purchase_in") byMonth[key].purchased += value;
    else byMonth[key].sold += value;
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period,
      purchased: Math.round(data.purchased * 100) / 100,
      sold: Math.round(data.sold * 100) / 100,
    }));
}

export async function getRecentActivity(limit = 6) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
