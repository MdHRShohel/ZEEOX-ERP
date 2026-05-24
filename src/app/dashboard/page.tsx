import { ModulePage } from "@/components/layout/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboardSummary } from "@/server/services/dashboard-service";
import { getAuditLogs } from "@/server/services/audit-service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
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
  const recentActivity = await getAuditLogs({ limit: 5 });

  return (
    <ModulePage
      title="Dashboard"
      description="Live management summary for sales, production, stock, courier, and expenses."
      stats={[
        { label: "Total Sales", value: summary.totalSale.toLocaleString("en-US"), help: "From invoice ledger" },
        { label: "Production Cost", value: summary.productionTotal.toLocaleString("en-US"), help: "Calculated from batches" },
        { label: "Courier Cost", value: summary.courierTotal.toLocaleString("en-US"), help: "Shipment charges" },
        { label: "Net Profit", value: summary.netProfit.toLocaleString("en-US"), help: "After cost deductions" },
        { label: "Current Stock", value: summary.stockCount.toLocaleString("en-US"), help: "Variant based" },
        { label: "Office Expenses", value: summary.officeExpenses.toLocaleString("en-US"), help: "Operating spend" }
      ]}
      items={[
        { title: "Low stock alert", detail: "Flag products with current stock below minimum threshold.", tag: "Inventory" },
        { title: "Unpaid invoices", detail: "Highlight invoices that need payment collection follow-up.", tag: "Sales" },
        { title: "Return handling", detail: "Capture customer and company return courier fees.", tag: "Courier" }
      ]}
    >
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[1fr_1fr_auto_auto]" action="/dashboard" method="get">
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
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                Reset
              </Link>
            ) : null}
          </form>
          <div className="flex flex-wrap gap-2">
            <Link href="/reports" className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Reports
            </Link>
            <Link href="/audit" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
              Audit log
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {recentActivity.length === 0 ? (
            <div className="md:col-span-full rounded-xl border border-dashed bg-slate-50 p-6 text-sm text-slate-600">
              No recent activity yet.
            </div>
          ) : (
            recentActivity.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-slate-50 p-4">
                <p className="font-medium">{entry.entity}</p>
                <p className="text-sm text-slate-600">{entry.action}</p>
                <p className="mt-1 text-xs text-slate-500">{entry.createdAt.toLocaleString()}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
