import type { NextApiRequest, NextApiResponse } from "next";
import { getDashboardSummary } from "@/server/services/dashboard-service";
import { toCsv } from "@/lib/csv";

function parseDate(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const summary = await getDashboardSummary({
    from: parseDate(req.query.from),
    to: parseDate(req.query.to)
  });

  if (req.query.format === "csv") {
    const csv = toCsv([
      { metric: "totalSale", value: summary.totalSale },
      { metric: "totalCost", value: summary.totalCost },
      { metric: "netProfit", value: summary.netProfit },
      { metric: "officeExpenses", value: summary.officeExpenses },
      { metric: "productionTotal", value: summary.productionTotal },
      { metric: "courierTotal", value: summary.courierTotal },
      { metric: "stockCount", value: summary.stockCount }
    ]);

    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", 'attachment; filename="dashboard-summary.csv"');
    return res.status(200).send(csv);
  }

  return res.status(200).json(summary);
}
