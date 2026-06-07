import { requireSession } from "@/lib/auth";
import {
  getInventoryValuationReport,
  getLowStockReport,
  getStockMovementReport,
  getProfitabilityReport,
  getPurchaseSummaryReport,
} from "@/server/services/reports-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const MOVEMENT_COLORS: Record<string, "success" | "danger" | "default" | "warning" | "muted"> = {
  purchase_in: "success",
  opening: "default",
  production_in: "success",
  return_in: "warning",
  transfer_in: "default",
  sale_out: "danger",
  transfer_out: "muted",
  adjustment: "warning",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { tab?: string; from?: string; to?: string; page?: string };
}) {
  const session = await requireSession();
  const tab = searchParams.tab ?? "valuation";

  const [valuation, lowStock, movements, profitability, purchases] = await Promise.all([
    tab === "valuation" ? getInventoryValuationReport() : Promise.resolve(null),
    tab === "low-stock" ? getLowStockReport() : Promise.resolve(null),
    tab === "movements"
      ? getStockMovementReport({ from: searchParams.from, to: searchParams.to, page: Number(searchParams.page ?? 1) })
      : Promise.resolve(null),
    tab === "profitability"
      ? getProfitabilityReport({ from: searchParams.from, to: searchParams.to })
      : Promise.resolve(null),
    tab === "purchases"
      ? getPurchaseSummaryReport({ from: searchParams.from, to: searchParams.to })
      : Promise.resolve(null),
  ]);

  const totalStockValue = valuation?.reduce((sum, p) => sum + p.totalValue, 0) ?? 0;

  const tabs = [
    { key: "valuation", label: "Inventory Valuation" },
    { key: "low-stock", label: "Low Stock Alerts" },
    { key: "movements", label: "Stock Movements" },
    { key: "profitability", label: "Profitability" },
    { key: "purchases", label: "Purchase Summary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Reports</h1>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-slate-700 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/reports?tab=${t.key}`}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Inventory Valuation */}
      {tab === "valuation" && valuation && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory Valuation</CardTitle>
            <a href="/api/reports/inventory-valuation">
              <Button size="sm" variant="outline">Export CSV</Button>
            </a>
          </CardHeader>
          <CardContent className="p-0">
            {valuation.length === 0 ? (
              <EmptyState title="No inventory data" description="Add products and stock movements to see valuation." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>SKU</Th>
                      <Th>Product</Th>
                      <Th>Category</Th>
                      <Th>UoM</Th>
                      <Th className="text-right">Stock Qty</Th>
                      <Th className="text-right">Cost Price</Th>
                      <Th className="text-right">Total Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {valuation.map((p) => (
                      <Tr key={p.variantId}>
                        <Td className="font-mono text-sm">{p.sku}</Td>
                        <Td>{p.name}</Td>
                        <Td>{p.category}</Td>
                        <Td>{p.uom}</Td>
                        <Td className="text-right">{p.currentStock}</Td>
                        <Td className="text-right">{formatCurrency(p.costPrice)}</Td>
                        <Td className="text-right font-medium">{formatCurrency(p.totalValue)}</Td>
                      </Tr>
                    ))}
                    <Tr>
                      <Td colSpan={6} className="text-right font-semibold text-white">Grand Total</Td>
                      <Td className="text-right font-bold text-white text-base">{formatCurrency(totalStockValue)}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Low Stock */}
      {tab === "low-stock" && lowStock && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alerts</CardTitle>
            <a href="/api/reports/low-stock">
              <Button size="sm" variant="outline">Export CSV</Button>
            </a>
          </CardHeader>
          <CardContent className="p-0">
            {lowStock.length === 0 ? (
              <EmptyState title="All products are sufficiently stocked" description="No products below reorder level." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>SKU</Th>
                      <Th>Product</Th>
                      <Th>Category</Th>
                      <Th className="text-right">Current Stock</Th>
                      <Th className="text-right">Reorder Level</Th>
                      <Th className="text-right">Deficit</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {lowStock.map((p) => (
                      <Tr key={p.variantId} className={p.currentStock <= 0 ? "bg-red-900/20" : "bg-amber-900/10"}>
                        <Td className="font-mono text-sm">{p.sku}</Td>
                        <Td>{p.name}</Td>
                        <Td>{p.category}</Td>
                        <Td className={`text-right font-medium ${p.currentStock <= 0 ? "text-red-400" : "text-amber-400"}`}>
                          {p.currentStock}
                        </Td>
                        <Td className="text-right">{p.reorderLevel}</Td>
                        <Td className="text-right text-red-400">{p.deficit}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock Movements */}
      {tab === "movements" && movements && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Movements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {movements.movements.length === 0 ? (
              <EmptyState title="No movements found" description="Post goods receipts or invoices to see movements." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>SKU</Th>
                      <Th>Product</Th>
                      <Th>Warehouse</Th>
                      <Th>Type</Th>
                      <Th className="text-right">Quantity</Th>
                      <Th>Reference</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {movements.movements.map((m) => (
                      <Tr key={m.id}>
                        <Td className="text-sm">{new Date(m.movedAt).toLocaleDateString()}</Td>
                        <Td className="font-mono text-sm">{m.productVariant.sku}</Td>
                        <Td>{m.productVariant.name}</Td>
                        <Td>{m.warehouse?.name ?? "—"}</Td>
                        <Td>
                          <Badge variant={MOVEMENT_COLORS[m.movementType] ?? "muted"}>
                            {m.movementType.replace(/_/g, " ")}
                          </Badge>
                        </Td>
                        <Td className="text-right">{m.quantity}</Td>
                        <Td className="text-xs text-slate-400">{m.referenceType ?? "—"}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profitability */}
      {tab === "profitability" && profitability && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profitability by Product</CardTitle>
            <a href="/api/reports/profitability">
              <Button size="sm" variant="outline">Export CSV</Button>
            </a>
          </CardHeader>
          <CardContent className="p-0">
            {profitability.length === 0 ? (
              <EmptyState title="No sales data" description="Post sales invoices to see profitability." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>SKU</Th>
                      <Th>Product</Th>
                      <Th className="text-right">Units Sold</Th>
                      <Th className="text-right">Revenue</Th>
                      <Th className="text-right">COGS</Th>
                      <Th className="text-right">Gross Profit</Th>
                      <Th className="text-right">Margin %</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {profitability.map((p) => (
                      <Tr key={p!.sku}>
                        <Td className="font-mono text-sm">{p!.sku}</Td>
                        <Td>{p!.name}</Td>
                        <Td className="text-right">{p!.unitsSold}</Td>
                        <Td className="text-right">{formatCurrency(p!.revenue)}</Td>
                        <Td className="text-right">{formatCurrency(p!.cogs)}</Td>
                        <Td className={`text-right font-medium ${p!.grossProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatCurrency(p!.grossProfit)}
                        </Td>
                        <Td className="text-right">{p!.marginPct}%</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purchase Summary */}
      {tab === "purchases" && purchases && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {purchases.length === 0 ? (
              <EmptyState title="No purchase orders" description="Create and confirm purchase orders to see summary." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>PO Number</Th>
                      <Th>Supplier</Th>
                      <Th>Order Date</Th>
                      <Th className="text-right">Total Amount</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {purchases.map((p) => (
                      <Tr key={p.poNumber}>
                        <Td className="font-mono text-sm">{p.poNumber}</Td>
                        <Td>{p.supplier}</Td>
                        <Td>{p.orderDate}</Td>
                        <Td className="text-right">{formatCurrency(p.totalAmount)}</Td>
                        <Td><Badge variant="muted">{p.status}</Badge></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
