import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, statusVariant } from "@/components/ui/badge";
import { getCustomerDetail } from "@/server/services/customer-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateCustomer } from "../actions";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageCustomers) redirect("/403");
  const { id } = await params;
  const customer = await getCustomerDetail(id);
  if (!customer) notFound();

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4"><Link href="/customers" className="text-sm text-slate-500 hover:text-slate-700">← Customers</Link></div>
        <PageHeader title={customer.name} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
              <CardContent>
                {customer.salesInvoices.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No invoices yet</p>
                ) : (
                  <Table>
                    <Thead><Tr><Th>Invoice No</Th><Th>Date</Th><Th>Total</Th><Th>Paid</Th><Th>Status</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {customer.salesInvoices.map((inv) => (
                        <Tr key={inv.id}>
                          <Td className="font-mono text-xs">{inv.invoiceNo}</Td>
                          <Td>{formatDate(inv.invoiceDate)}</Td>
                          <Td>{formatCurrency(inv.totalAmount)}</Td>
                          <Td>{formatCurrency(inv.paidAmount)}</Td>
                          <Td><Badge variant={statusVariant(inv.status)}>{STATUS_LABELS[inv.status]}</Badge></Td>
                          <Td><Link href={`/sales/invoices/${inv.id}`}><Button variant="ghost" size="sm">View</Button></Link></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Edit Customer</CardTitle></CardHeader>
            <CardContent>
              <form action={updateCustomer} className="space-y-3">
                <input type="hidden" name="id" value={customer.id} />
                {(["name", "contactName", "mobile", "email", "address", "notes"] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-slate-600 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                    <input name={field} defaultValue={(customer as Record<string, unknown>)[field] as string ?? ""} type={field === "email" ? "email" : "text"} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                ))}
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
