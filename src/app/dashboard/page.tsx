import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  getDashboardKPIs,
  getRevenueTrend,
  getTopProductsByRevenue,
  getStockStatusDistribution,
  getPurchaseVsSalesTrend,
  getRecentActivity,
} from "@/server/services/dashboard-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import { TopProductsChart } from "@/components/charts/top-products-chart";
import { StockStatusChart } from "@/components/charts/stock-status-chart";
import { PurchaseVsSalesChart } from "@/components/charts/purchase-vs-sales-chart";

export const dynamic = "force-dynamic";

const ACTION_COLORS = {
  create: "success",
  update: "default",
  delete: "danger",
  post: "warning",
} as const;

export default async function DashboardPage() {
  await requireSession();

  const [kpis, revenueTrend, topProducts, stockStatus, pvsTrend, recentActivity] =
    await Promise.all([
      getDashboardKPIs(),
      getRevenueTrend(),
      getTopProductsByRevenue(),
      getStockStatusDistribution(),
      getPurchaseVsSalesTrend(),
      getRecentActivity(),
    ]);

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(kpis.totalRevenue)} />
          <StatCard label="Gross Profit" value={formatCurrency(kpis.grossProfit)} subtext={`${kpis.grossMarginPct}% margin`} />
          <StatCard label="Stock Value" value={formatCurrency(kpis.stockValue)} />
          <StatCard label="Low / Out Stock" value={`${kpis.lowStockCount} / ${kpis.outOfStockCount}`} subtext="products" />
          <StatCard label="Pending POs" value={kpis.pendingPOs} subtext={`${formatCurrency(kpis.unpaidValue)} receivable`} />
        </div>

        {/* Revenue Trend */}
        <Card>
          <CardHeader><CardTitle>Revenue & Profit Trend</CardTitle></CardHeader>
          <CardContent>
            <RevenueTrendChart data={revenueTrend} />
          </CardContent>
        </Card>

        {/* Two charts side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Top Products by Revenue</CardTitle></CardHeader>
            <CardContent>
              <TopProductsChart data={topProducts} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Stock Status</CardTitle></CardHeader>
            <CardContent>
              <StockStatusChart data={stockStatus} />
            </CardContent>
          </Card>
        </div>

        {/* Purchase vs Sales */}
        <Card>
          <CardHeader><CardTitle>Purchase vs Sales Flow</CardTitle></CardHeader>
          <CardContent>
            <PurchaseVsSalesChart data={pvsTrend} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((log) => (
                  <li key={log.id} className="flex items-center gap-3 text-sm">
                    <Badge variant={ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] ?? "muted"}>
                      {log.action}
                    </Badge>
                    <span className="font-medium">{log.entityType}</span>
                    <span className="text-slate-400">#{log.entityId.slice(-6)}</span>
                    {log.actorName && <span className="text-slate-500">by {log.actorName}</span>}
                    <span className="text-slate-400 ml-auto">{formatDateTime(log.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
