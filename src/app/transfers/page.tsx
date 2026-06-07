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
import { getTransfers, getTransferStats } from "@/server/services/transfer-service";
import { getWarehouseDropdownList } from "@/server/services/warehouse-service";
import { formatDate, formatNumber } from "@/lib/utils";
import { createStockTransfer } from "./actions";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TransfersPage() {
  const session = await requireSession();
  if (!getPermissions(session.role).canTransferStock) redirect("/403");

  const [transfers, stats, warehouses] = await Promise.all([
    getTransfers(),
    getTransferStats(),
    getWarehouseDropdownList(),
  ]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Stock Transfers" description="Move stock between warehouses" />
        <ModuleStats stats={[
          { label: "Total Transfers", value: stats.total },
          { label: "Total Units Transferred", value: formatNumber(stats.totalUnits) },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="pt-4">
              {transfers.length === 0 ? (
                <EmptyState title="No transfers yet" description="Create a transfer using the form" />
              ) : (
                <Table>
                  <Thead>
                    <Tr><Th>Transfer No</Th><Th>From</Th><Th>To</Th><Th>Date</Th><Th>Items</Th><Th>Status</Th><Th></Th></Tr>
                  </Thead>
                  <Tbody>
                    {transfers.map((t) => (
                      <Tr key={t.id}>
                        <Td className="font-mono text-xs font-medium">{t.transferNo}</Td>
                        <Td>{t.fromWarehouse.name}</Td>
                        <Td>{t.toWarehouse.name}</Td>
                        <Td>{formatDate(t.transferDate)}</Td>
                        <Td>{t._count.items}</Td>
                        <Td><Badge variant={statusVariant(t.status)}>{STATUS_LABELS[t.status]}</Badge></Td>
                        <Td><Link href={`/transfers/${t.id}`}><Button variant="ghost" size="sm">View</Button></Link></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">New Transfer</p>
              {warehouses.length < 2 ? (
                <p className="text-sm text-slate-400">You need at least 2 warehouses to create a transfer. <Link href="/settings/warehouses" className="underline text-slate-600">Add warehouses.</Link></p>
              ) : (
                <form action={createStockTransfer} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Transfer Number *</label>
                    <input name="transferNo" required placeholder="e.g. TRF-2024-001" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">From Warehouse *</label>
                    <select name="fromWarehouseId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                      <option value="">Select source</option>
                      {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">To Warehouse *</label>
                    <select name="toWarehouseId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                      <option value="">Select destination</option>
                      {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Transfer Date *</label>
                    <input name="transferDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Notes</label>
                    <textarea name="notes" rows={2} className="mt-1 flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <Button type="submit" className="w-full">Create Transfer</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
