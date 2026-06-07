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
import { getSalesInvoices, getInvoiceStats } from "@/server/services/sales-service";
import { getCustomerDropdownList } from "@/server/services/customer-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import CreateSalesInvoiceForm from "./create-form";

export const dynamic = "force-dynamic";

const STATUS_COLORS = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
  cancelled: "muted",
} as const;

export default async function SalesInvoicesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSales) redirect("/403");

  const [invoices, stats, customers] = await Promise.all([
    getSalesInvoices(searchParams),
    getInvoiceStats(),
    getCustomerDropdownList(),
  ]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader
          title="Sales Invoices"
          action={<CreateSalesInvoiceForm customers={customers} />}
        />
        <ModuleStats
          stats={[
            { label: "Total Invoices", value: stats.total },
            { label: "Unpaid / Partial", value: stats.unpaid },
            { label: "Total Revenue", value: formatCurrency(stats.totalRevenue) },
            { label: "Collected", value: formatCurrency(stats.totalPaid) },
          ]}
        />
        <Card>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <EmptyState title="No invoices" description="Create your first invoice to get started." />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Invoice No</Th>
                    <Th>Customer</Th>
                    <Th>Date</Th>
                    <Th>Due Date</Th>
                    <Th>Total</Th>
                    <Th>Paid</Th>
                    <Th>Balance</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {invoices.map((inv) => {
                    const balance = Number(inv.totalAmount) - Number(inv.paidAmount);
                    return (
                      <Tr key={inv.id}>
                        <Td className="font-mono text-sm">{inv.invoiceNo}</Td>
                        <Td>{inv.customer.name}</Td>
                        <Td>{formatDate(inv.invoiceDate)}</Td>
                        <Td>{inv.dueDate ? formatDate(inv.dueDate) : "—"}</Td>
                        <Td>{formatCurrency(Number(inv.totalAmount))}</Td>
                        <Td>{formatCurrency(Number(inv.paidAmount))}</Td>
                        <Td className={balance > 0 ? "text-red-500" : "text-green-600"}>
                          {formatCurrency(balance)}
                        </Td>
                        <Td>
                          <Badge variant={STATUS_COLORS[inv.status] ?? "muted"}>{inv.status}</Badge>
                        </Td>
                        <Td>
                          <Link href={`/sales/invoices/${inv.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
