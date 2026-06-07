import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleStats } from "@/components/layout/module-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getCustomers, getCustomerStats } from "@/server/services/customer-service";
import { createCustomer } from "./actions";

export const dynamic = "force-dynamic";

interface Props { searchParams: Promise<{ q?: string }> }

export default async function CustomersPage({ searchParams }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageCustomers) redirect("/403");
  const { q } = await searchParams;
  const [customers, stats] = await Promise.all([getCustomers({ search: q }), getCustomerStats()]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Customers" />
        <ModuleStats stats={[{ label: "Total", value: stats.total }, { label: "Active", value: stats.active }]} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4 flex gap-2">
              <form className="flex gap-2 flex-1">
                <input name="q" defaultValue={q} placeholder="Search customers…" className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                <Button type="submit" variant="outline" size="sm">Search</Button>
                {q && <Link href="/customers"><Button variant="ghost" size="sm">Reset</Button></Link>}
              </form>
            </div>
            <Card>
              <CardContent className="pt-0">
                {customers.length === 0 ? (
                  <EmptyState title="No customers found" />
                ) : (
                  <Table>
                    <Thead><Tr><Th>Name</Th><Th>Contact</Th><Th>Mobile</Th><Th>Invoices</Th><Th>Status</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {customers.map((c) => (
                        <Tr key={c.id}>
                          <Td className="font-medium">{c.name}</Td>
                          <Td>{c.contactName ?? "—"}</Td>
                          <Td>{c.mobile ?? "—"}</Td>
                          <Td>{c._count.salesInvoices}</Td>
                          <Td><Badge variant={c.isActive ? "success" : "muted"}>{c.isActive ? "Active" : "Inactive"}</Badge></Td>
                          <Td><Link href={`/customers/${c.id}`}><Button variant="ghost" size="sm">View</Button></Link></Td>
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
              <p className="text-sm font-semibold text-slate-700 mb-3">Add Customer</p>
              <form action={createCustomer} className="space-y-3">
                {(["name", "contactName", "mobile", "email", "address"] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-slate-600 capitalize">{field.replace(/([A-Z])/g, " $1")}{field === "name" ? " *" : ""}</label>
                    <input name={field} required={field === "name"} type={field === "email" ? "email" : "text"} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                ))}
                <Button type="submit" className="w-full">Add Customer</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
