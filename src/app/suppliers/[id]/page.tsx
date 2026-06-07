import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, statusVariant } from "@/components/ui/badge";
import { getSupplierDetail } from "@/server/services/supplier-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateSupplier } from "../actions";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

export default async function SupplierDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSuppliers) redirect("/403");
  const { id } = await params;
  const supplier = await getSupplierDetail(id);
  if (!supplier) notFound();

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4"><Link href="/suppliers" className="text-sm text-slate-500 hover:text-slate-700">← Suppliers</Link></div>
        <PageHeader title={supplier.name} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Recent Purchase Orders</CardTitle></CardHeader>
              <CardContent>
                {supplier.purchaseOrders.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No purchase orders yet</p>
                ) : (
                  <Table>
                    <Thead><Tr><Th>PO Number</Th><Th>Warehouse</Th><Th>Date</Th><Th>Status</Th><Th>Total</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {supplier.purchaseOrders.map((po) => (
                        <Tr key={po.id}>
                          <Td className="font-mono text-xs">{po.poNumber}</Td>
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
            <CardHeader><CardTitle>Edit Supplier</CardTitle></CardHeader>
            <CardContent>
              <form action={updateSupplier} className="space-y-3">
                <input type="hidden" name="id" value={supplier.id} />
                {(["name", "contactName", "mobile", "email", "address", "taxId", "notes"] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-slate-600 capitalize">{field === "taxId" ? "Tax ID" : field.replace(/([A-Z])/g, " $1")}</label>
                    <input name={field} defaultValue={(supplier as Record<string, unknown>)[field] as string ?? ""} type={field === "email" ? "email" : "text"} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isActive" value="true" defaultChecked={supplier.isActive} id="isActiveSup" className="h-4 w-4" />
                  <label htmlFor="isActiveSup" className="text-sm text-slate-700">Active</label>
                </div>
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
