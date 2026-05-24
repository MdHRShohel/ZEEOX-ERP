import { prisma } from "@/lib/prisma";
import { calculateCurrentStock, calculateCourierTotal, calculateNetProfit, calculateProductionTotal } from "@/lib/calculations";

function buildRangeWhere(field: string, from?: Date, to?: Date) {
  if (!from && !to) return {};
  return {
    [field]: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    }
  };
}

export async function getDashboardSummary(filters?: { from?: Date; to?: Date }) {
  const productionWhere = buildRangeWhere("batchDate", filters?.from, filters?.to);
  const salesWhere = buildRangeWhere("invoiceDate", filters?.from, filters?.to);
  const courierWhere = buildRangeWhere("shipmentDate", filters?.from, filters?.to);
  const expenseWhere = buildRangeWhere("expenseDate", filters?.from, filters?.to);

  const [sales, expenses, production, couriers, variants, ledgers] = await Promise.all([
    prisma.salesInvoice.aggregate({ where: salesWhere, _sum: { totalSale: true, totalCost: true, netProfit: true } }),
    prisma.officeExpense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
    prisma.productionBatch.aggregate({
      where: productionWhere,
      _sum: {
        materialCost: true,
        laborCost: true,
        packagingCost: true,
        otherCost: true,
        quantity: true
      }
    }),
    prisma.courierShipment.aggregate({
      where: courierWhere,
      _sum: {
        deliveryCharge: true,
        codCharge: true,
        returnCharge: true
      }
    }),
    prisma.productVariant.findMany({
      select: {
        id: true,
        openingStock: true
      }
    }),
    prisma.stockLedger.findMany({
      select: {
        productVariantId: true,
        movementType: true,
        quantity: true
      }
    })
  ]);

  const productionTotal = calculateProductionTotal({
    materialCost: Number(production._sum.materialCost ?? 0),
    laborCost: Number(production._sum.laborCost ?? 0),
    packagingCost: Number(production._sum.packagingCost ?? 0),
    otherCost: Number(production._sum.otherCost ?? 0)
  });

  const courierTotal = calculateCourierTotal({
    deliveryCharge: Number(couriers._sum.deliveryCharge ?? 0),
    codCharge: Number(couriers._sum.codCharge ?? 0),
    returnCharge: Number(couriers._sum.returnCharge ?? 0)
  });

  const totalSale = Number(sales._sum.totalSale ?? 0);
  const totalCost = Number(sales._sum.totalCost ?? 0);
  const netProfit = calculateNetProfit(totalSale, totalCost);
  const officeExpenses = Number(expenses._sum.amount ?? 0);

  const ledgerByVariant = new Map<string, { production: number; sales: number; returns: number }>();
  for (const ledger of ledgers) {
    const current = ledgerByVariant.get(ledger.productVariantId) ?? { production: 0, sales: 0, returns: 0 };
    if (ledger.movementType === "production_in") current.production += ledger.quantity;
    if (ledger.movementType === "sale_out") current.sales += ledger.quantity;
    if (ledger.movementType === "return_in") current.returns += ledger.quantity;
    ledgerByVariant.set(ledger.productVariantId, current);
  }

  const stockCount = variants.reduce((sum: number, variant: { id: string; openingStock: number }) => {
    const movements = ledgerByVariant.get(variant.id) ?? { production: 0, sales: 0, returns: 0 };
    return sum + calculateCurrentStock({
      openingStock: variant.openingStock,
      productionQty: movements.production,
      soldQty: movements.sales,
      returnedQty: movements.returns
    });
  }, 0);

  return {
    totalSale,
    totalCost,
    netProfit,
    officeExpenses,
    productionTotal,
    courierTotal,
    stockCount,
    totalBatches: Number(production._sum.quantity ?? 0)
  };
}
