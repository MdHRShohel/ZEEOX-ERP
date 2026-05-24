export function calculateCurrentStock(input: {
  openingStock: number;
  productionQty: number;
  soldQty: number;
  returnedQty: number;
}) {
  return input.openingStock + input.productionQty - input.soldQty + input.returnedQty;
}

export function calculateProductionTotal(input: {
  materialCost: number;
  laborCost: number;
  packagingCost: number;
  otherCost: number;
}) {
  return input.materialCost + input.laborCost + input.packagingCost + input.otherCost;
}

export function calculateSalesTotal(qty: number, sellingPrice: number) {
  return qty * sellingPrice;
}

export function calculateCourierTotal(input: {
  deliveryCharge: number;
  codCharge: number;
  returnCharge: number;
}) {
  return input.deliveryCharge + input.codCharge + input.returnCharge;
}

export function calculateTotalCost(input: {
  productionCost: number;
  courierCost: number;
  adsCost: number;
  packagingCost: number;
  returnAdjustments?: number;
}) {
  return input.productionCost + input.courierCost + input.adsCost + input.packagingCost + (input.returnAdjustments ?? 0);
}

export function calculateNetProfit(totalSale: number, totalCost: number) {
  return totalSale - totalCost;
}

export function calculateStockValue(currentStock: number, productionCostPerUnit: number) {
  return currentStock * productionCostPerUnit;
}

