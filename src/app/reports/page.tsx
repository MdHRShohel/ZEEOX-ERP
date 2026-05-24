import { ModulePage } from "@/components/layout/module-page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboardSummary } from "@/server/services/dashboard-service";

export const dynamic = "force-dynamic";

const reportRows = [
  { title: "Sales report", detail: "By date, customer, and product model." },
  { title: "Profit report", detail: "Total sale minus total cost with return adjustments." },
  { title: "Stock value report", detail: "Current stock multiplied by unit cost." },
  { title: "API export", detail: "GET /api/reports/summary?format=csv for a downloadable summary." }
];

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: { from?: string; to?: string };
}) {
  const parseDate = (value?: string) => {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  };
  const from = parseDate(searchParams?.from);
  const to = parseDate(searchParams?.to);
  const summary = await getDashboardSummary({ from, to });
  const exportQuery = new URLSearchParams();
  if (searchParams?.from) exportQuery.set("from", searchParams.from);
  if (searchParams?.to) exportQuery.set("to", searchParams.to);
  const exportSuffix = exportQuery.toString() ? `?${exportQuery.toString()}` : "";

  return (
    <ModulePage
      title="Reports"
      description="Use reporting views for sales, profit, stock value, production cost, courier cost, and investor summaries."
      sections={[
        { label: "Summary", href: "#summary" },
        { label: "Export", href: "#export" },
        { label: "Share", href: "#share" }
      ]}
      stats={[
        { label: "Total Sales", value: summary.totalSale.toLocaleString("en-US"), help: "Invoice rollup" },
        { label: "Net Profit", value: summary.netProfit.toLocaleString("en-US"), help: "After costs" },
        { label: "Current Stock", value: summary.stockCount.toLocaleString("en-US"), help: "Variant balance" },
        { label: "Office Expenses", value: summary.officeExpenses.toLocaleString("en-US"), help: "Operating spend" }
      ]}
      items={reportRows}
    >
      <Card id="summary">
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]" action="/reports" method="get">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input id="from" name="from" type="date" defaultValue={searchParams?.from ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input id="to" name="to" type="date" defaultValue={searchParams?.to ?? ""} />
            </div>
            <Button type="submit">Filter</Button>
            {(searchParams?.from || searchParams?.to) ? (
              <a className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200" href="/reports">
                Reset
              </a>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card id="export">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Production Cost</p>
            <p className="mt-2 text-2xl font-semibold">{summary.productionTotal.toLocaleString("en-US")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Courier Cost</p>
            <p className="mt-2 text-2xl font-semibold">{summary.courierTotal.toLocaleString("en-US")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Total Batches</p>
            <p className="mt-2 text-2xl font-semibold">{summary.totalBatches.toLocaleString("en-US")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Exports</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
                href={`/api/reports/summary${exportSuffix}`}
              >
                JSON
              </a>
              <a
                className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900 hover:bg-slate-200"
                href={`/api/reports/summary?format=csv${exportSuffix ? `&${exportSuffix.slice(1)}` : ""}`}
                download="dashboard-summary.csv"
              >
                CSV
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
      <Card id="share">
        <CardContent className="p-5 text-sm text-slate-600">
          Use the Save as PDF button in the page header to export this report view, or share the current URL with its filters intact.
        </CardContent>
      </Card>
    </ModulePage>
  );
}
