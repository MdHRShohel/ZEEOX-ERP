import { StockMovementType } from "@prisma/client";

interface LedgerMovement {
  movementType: StockMovementType;
  quantity: number;
}

const INBOUND: StockMovementType[] = [
  "opening",
  "purchase_in",
  "production_in",
  "return_in",
  "transfer_in",
];

const OUTBOUND: StockMovementType[] = ["sale_out", "transfer_out"];

export function computeCurrentStock(movements: LedgerMovement[]): number {
  let stock = 0;
  for (const m of movements) {
    if (INBOUND.includes(m.movementType)) {
      stock += m.quantity;
    } else if (OUTBOUND.includes(m.movementType)) {
      stock -= m.quantity;
    } else if (m.movementType === "adjustment") {
      stock += m.quantity; // negative quantity = write-down
    }
  }
  return stock;
}

export function computeGrossProfit(salePrice: number, costPrice: number, qty: number): number {
  return (salePrice - costPrice) * qty;
}

export function computeInvoiceSubtotal(items: { quantity: number; unitPrice: number }[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
}

export function computePoTotal(items: { orderedQty: number; unitCost: number }[]): number {
  return items.reduce((sum, i) => sum + i.orderedQty * Number(i.unitCost), 0);
}

export function computeOrderTotal(items: { orderedQty: number; unitPrice: number }[]): number {
  return items.reduce((sum, i) => sum + i.orderedQty * Number(i.unitPrice), 0);
}

export function computeReturnTotal(items: { quantity: number; unitPrice: number }[]): number {
  return items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
}
