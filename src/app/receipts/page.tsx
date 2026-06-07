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
import { getGoodsReceipts, getGrnStats } from "@/server/services/grn-service";
import { getPurchaseOrderDropdownList } from "@/server/services/purchase-service";
import { getWarehouseDropdownList } from "@/server/services/warehouse-service";
import { formatDate, formatNumber } from "@/lib/utils";
import { createGoodsReceipt } from "./actions";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props { searchParams: Promise<{ q?: string; poId?: string }> }

export default async function ReceiptsPage({ searchParams }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canReceiveGoods) redirect("/403");

  const { q, poId } = await searchParams;
  const [receipts, stats, pos, warehouses] = await Promise.all([
    getGoodsReceipts({ search: q, purchaseOrderId: poId }),
    getGrnStats(),
    getPurchaseOrderDropdownList(),
    getWarehouseDropdownList(),
  ]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Goods Receipts" description="Record stock received from purchase orders" />
        <ModuleStats stats={[
          { label: "Total GRNs", value: stats.total },
          { label: "Posted", value: stats.posted },
          { label: "Total Units Received", value: formatNumber(stats.totalUnitsReceived) },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4 flex gap-2">
              <form className="flex gap-2 flex-1">
                <input name="q" defaultValue={q} placeholder="Search GRN or PO number…" className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                <Button type="submit" variant="outline" size="sm">Search</Button>
                {(q || poId) && <Link href="/receipts"><Button variant="ghost" size="sm">Reset</Button></Link>}
              </form>
            </div>
            <Card>
              <CardContent className="pt-0">
                {receipts.length === 0 ? (
                  <EmptyState title="No goods receipts" description="Create a GRN by selecting a purchase order" />
                ) : (
                  <Table>
                    <Thead>
                      <Tr><Th>GRN Number</Th><Th>PO Number</Th><Th>Supplier</Th><Th>Date</Th><Th>Items</Th><Th>Status</Th><Th></Th></Tr>
                    </Thead>
                    <Tbody>
                      {receipts.map((grn) => (
                        <Tr key={grn.id}>
                          <Td className="font-mono text-xs font-medium">{grn.grnNumber}</Td>
                          <Td className="font-mono text-xs">{grn.purchaseOrder.poNumber}</Td>
                          <Td>{grn.purchaseOrder.supplier.name}</Td>
                          <Td>{formatDate(grn.receiptDate)}</Td>
                          <Td>{grn._count.items}</Td>
                          <Td><Badge variant={statusVariant(grn.status)}>{STATUS_LABELS[grn.status]}</Badge></Td>
                          <Td><Link href={`/receipts/${grn.id}`}><Button variant="ghost" size="sm">View</Button></Link></Td>
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
              <p className="text-sm font-semibold text-slate-700 mb-3">New Goods Receipt</p>
              {pos.length === 0 ? (
                <p className="text-sm text-slate-400">No confirmed purchase orders available. <Link href="/purchases" className="underline text-slate-600">Create a PO first.</Link></p>
              ) : (
                <form action={createGoodsReceipt} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">GRN Number *</label>
                    <input name="grnNumber" required placeholder="e.g. GRN-2024-001" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Purchase Order *</label>
                    <select name="purchaseOrderId" required defaultValue={poId ?? ""} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                      <option value="">Select PO</option>
                      {pos.map((po) => <option key={po.id} value={po.id}>{po.poNumber} — {po.supplier.name}</option>)}
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
                    <label className="text-xs font-medium text-slate-600">Receipt Date *</label>
                    <input name="receiptDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Notes</label>
                    <textarea name="notes" rows={2} className="mt-1 flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <Button type="submit" className="w-full">Create GRN</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
