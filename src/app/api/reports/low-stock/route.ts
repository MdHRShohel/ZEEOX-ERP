import { requireSession } from "@/lib/auth";
import { getLowStockReport } from "@/server/services/reports-service";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireSession();
  const data = await getLowStockReport();
  const csv = toCSV(
    ["SKU", "Product", "Category", "Current Stock", "Reorder Level", "Deficit"],
    data.map((p) => [p.sku, p.name, p.category, p.currentStock, p.reorderLevel, p.deficit])
  );
  return csvResponse(csv, "low-stock-alerts.csv");
}
