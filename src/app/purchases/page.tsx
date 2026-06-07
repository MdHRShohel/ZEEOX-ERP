import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleStats } from "@/components/layout/module-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getPurchaseOrders, getPurchaseStats } from "@/server/services/purchase-service";
import { getSupplierDropdownList } from "@/server/services/supplier-service";
import { getWarehouseDropdownList } from "@/server/services/warehouse-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createPurchaseOrder } from "./actions";
import { STATUS_LABELS, PURCHASE_ORDER_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props { searchParams: Promise<{ q?: string; status?: string; supplierId?: string }> }

export default async function PurchasesPage({ searchParams }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManagePurchases) redirect("/403");

  const { q, status, supplierId } = await searchParams;
  const [orders, stats, suppliers, warehouses] = await Promise.all([
    getPurchaseOrders({ search: q, status, supplierId }),
    getPurchaseStats(),
    getSupplierDropdownList(),
    getWarehouseDropdownList(),
  ]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Purchase Orders" description="Track orders placed with suppliers" />
        <ModuleStats stats={[
          { label: "Total POs", value: stats.total },
          { label: "Draft", value: stats.draft },
          { label: "Confirmed", value: stats.confirmed },
          { label: "Total Value", value: formatCurrency(stats.totalValue) },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4 flex gap-2 flex-wrap">
              <form className="flex gap-2 flex-wrap flex-1">
                <input name="q" defaultValue={q} placeholder="Search PO number or supplier…" className="flex h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 min-w-40 flex-1" />
                <select name="status" defaultValue={status} className="flex h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                  <option value="">All Statuses</option>
                  {PURCHASE_ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <select name="supplierId" defaultValue={supplierId} className="flex h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                  <option value="">All Suppliers</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <Button type="submit" variant="outline" size="sm">Filter</Button>
                {(q || status || supplierId) && <Link href="/purchases"><Button variant="ghost" size="sm">Reset</Button></Link>}
              </form>
            </div>
            <Card>
              <CardContent className="pt-0">
                {orders.length === 0 ? (
                  <EmptyState title="No purchase orders" description="Create your first PO using the form" />
                ) : (
                  <Table>
                    <Thead>
                      <Tr><Th>PO Number</Th><Th>Supplier</Th><Th>Warehouse</Th><Th>Order Date</Th><Th>Status</Th><Th>Total</Th><Th></Th></Tr>
                    </Thead>
                    <Tbody>
                      {orders.map((po) => (
                        <Tr key={po.id}>
                          <Td className="font-mono text-xs font-medium">{po.poNumber}</Td>
                          <Td>{po.supplier.name}</Td>
                          <Td>{po.warehouse.name}</Td>
                          <Td>{formatDate(po.orderDate)}</Td>
                          <Td><Badge variant={statusVariant(po.status)}>{STATUS_LABELS[po.status]}</Badge></Td>
                          <Td>{formatCurrency(po.totalAmount)}</Td>
                          <Td><Link href={`/purchases/${po.id}`}><Button variant="ghost" size="sm">View</Button></Link></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">New Purchase Order</p>
              <form action={createPurchaseOrder} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">PO Number *</label>
                  <input name="poNumber" required placeholder="e.g. PO-2024-001" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Supplier *</label>
                  <select name="supplierId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Warehouse *</label>
                  <select name="warehouseId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select warehouse</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.isDefault ? " ★" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Order Date *</label>
                  <input name="orderDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Expected Date</label>
                  <input name="expectedDate" type="date" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Notes</label>
                  <textarea name="notes" rows={2} className="mt-1 flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <Button type="submit" className="w-full">Create PO</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
