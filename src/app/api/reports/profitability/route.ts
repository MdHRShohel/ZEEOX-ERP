import { requireSession } from "@/lib/auth";
import { getProfitabilityReport } from "@/server/services/reports-service";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireSession();
  const data = await getProfitabilityReport();
  const csv = toCSV(
    ["SKU", "Product", "Units Sold", "Revenue", "COGS", "Gross Profit", "Margin %"],
    (data.filter(Boolean) as NonNullable<(typeof data)[number]>[]).map((p) => [
      p.sku, p.name, p.unitsSold, p.revenue, p.cogs, p.grossProfit, `${p.marginPct}%`,
    ])
  );
  return csvResponse(csv, "profitability-report.csv");
}
