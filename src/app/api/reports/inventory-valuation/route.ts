import { requireSession } from "@/lib/auth";
import { getInventoryValuationReport } from "@/server/services/reports-service";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireSession();
  const data = await getInventoryValuationReport();
  const csv = toCSV(
    ["SKU", "Product", "Category", "UoM", "Current Stock", "Cost Price", "Total Value"],
    data.map((p) => [p.sku, p.name, p.category, p.uom, p.currentStock, p.costPrice, p.totalValue])
  );
  return csvResponse(csv, "inventory-valuation.csv");
}
