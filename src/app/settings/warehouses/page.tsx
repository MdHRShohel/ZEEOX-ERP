import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleStats } from "@/components/layout/module-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getWarehouses, getWarehouseStats } from "@/server/services/warehouse-service";
import { createWarehouse, deleteWarehouse } from "./actions";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageWarehouses) redirect("/403");

  const [warehouses, stats] = await Promise.all([getWarehouses(), getWarehouseStats()]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Warehouses" description="Manage storage locations" />
        <ModuleStats stats={[
          { label: "Total", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Default", value: stats.defaultName },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="pt-4">
              {warehouses.length === 0 ? (
                <EmptyState title="No warehouses yet" description="Add your first warehouse to start tracking stock locations" />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Location</Th>
                      <Th>Status</Th>
                      <Th>Default</Th>
                      <Th>POs</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {warehouses.map((wh) => (
                      <Tr key={wh.id}>
                        <Td className="font-medium">{wh.name}</Td>
                        <Td>{wh.location ?? "—"}</Td>
                        <Td>
                          <Badge variant={wh.isActive ? "success" : "muted"}>
                            {wh.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </Td>
                        <Td>{wh.isDefault ? <Badge variant="info">Default</Badge> : "—"}</Td>
                        <Td>{wh._count.purchaseOrders}</Td>
                        <Td>
                          <form action={deleteWarehouse} className="inline">
                            <input type="hidden" name="id" value={wh.id} />
                            <Button type="submit" variant="ghost" size="sm" className="text-red-600">Delete</Button>
                          </form>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Add Warehouse</p>
              <form action={createWarehouse} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Name</label>
                  <input name="name" required placeholder="e.g. Main Warehouse" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Location</label>
                  <input name="location" placeholder="e.g. 123 Main St" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isDefault" value="true" id="isDefault" className="h-4 w-4" />
                  <label htmlFor="isDefault" className="text-sm text-slate-700">Set as default</label>
                </div>
                <Button type="submit" className="w-full">Add Warehouse</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
