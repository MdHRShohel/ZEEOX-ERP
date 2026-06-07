import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { getAdjustments } from "@/server/services/adjustment-service";
import { getProductDropdownList } from "@/server/services/product-service";
import { getWarehouseDropdownList } from "@/server/services/warehouse-service";
import { formatDate, formatNumber } from "@/lib/utils";
import { postStockAdjustment } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdjustmentsPage() {
  const session = await requireSession();
  if (!getPermissions(session.role).canAdjustStock) redirect("/403");

  const [adjustments, products, warehouses] = await Promise.all([
    getAdjustments(),
    getProductDropdownList(),
    getWarehouseDropdownList(),
  ]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Stock Adjustments" description="Write-up or write-down stock quantities" />
        <Alert variant="warning" className="mb-6">
          Stock adjustments directly modify your inventory levels. Use positive quantities for write-ups and negative quantities for write-downs.
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="pt-4">
              {adjustments.length === 0 ? (
                <EmptyState title="No adjustments yet" description="Post your first stock adjustment using the form" />
              ) : (
                <Table>
                  <Thead>
                    <Tr><Th>Date</Th><Th>Product</Th><Th>SKU</Th><Th>Quantity</Th><Th>Warehouse</Th><Th>Reason</Th></Tr>
                  </Thead>
                  <Tbody>
                    {adjustments.map((a) => (
                      <Tr key={a.id}>
                        <Td>{formatDate(a.movedAt)}</Td>
                        <Td className="font-medium">{a.productVariant.name}</Td>
                        <Td className="font-mono text-xs">{a.productVariant.sku}</Td>
                        <Td className={a.quantity >= 0 ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>
                          {a.quantity >= 0 ? "+" : ""}{formatNumber(a.quantity)} {a.productVariant.uom.abbreviation}
                        </Td>
                        <Td>{a.warehouse?.name ?? "—"}</Td>
                        <Td className="max-w-xs truncate">{a.notes ?? "—"}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Post Adjustment</p>
              <form action={postStockAdjustment} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Product *</label>
                  <select name="productVariantId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Warehouse</label>
                  <select name="warehouseId" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">No warehouse</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Quantity * (negative = write-down)</label>
                  <input name="quantity" type="number" required placeholder="e.g. 10 or -5" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Reason *</label>
                  <input name="reason" required placeholder="e.g. Physical count correction" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Date</label>
                  <input name="adjustedAt" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <Button type="submit" className="w-full">Post Adjustment</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
