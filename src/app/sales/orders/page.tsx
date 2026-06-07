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
import { getSalesOrders, getSalesOrderStats } from "@/server/services/sales-service";
import { getCustomerDropdownList } from "@/server/services/customer-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import CreateSalesOrderForm from "./create-form";

export const dynamic = "force-dynamic";

const STATUS_COLORS = {
  draft: "muted",
  confirmed: "default",
  invoiced: "success",
  cancelled: "danger",
} as const;

export default async function SalesOrdersPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSales) redirect("/403");

  const [orders, stats, customers] = await Promise.all([
    getSalesOrders(searchParams),
    getSalesOrderStats(),
    getCustomerDropdownList(),
  ]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader
          title="Sales Orders"
          action={<CreateSalesOrderForm customers={customers} />}
        />
        <ModuleStats
          stats={[
            { label: "Total Orders", value: stats.total },
            { label: "Draft", value: stats.draft },
            { label: "Confirmed", value: stats.confirmed },
            { label: "Order Value", value: formatCurrency(stats.totalValue) },
          ]}
        />
        <Card>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <EmptyState title="No sales orders" description="Create your first sales order to get started." />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Order No</Th>
                    <Th>Customer</Th>
                    <Th>Order Date</Th>
                    <Th>Items</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map((o) => (
                    <Tr key={o.id}>
                      <Td className="font-mono text-sm">{o.orderNo}</Td>
                      <Td>{o.customer.name}</Td>
                      <Td>{formatDate(o.orderDate)}</Td>
                      <Td>{o._count.items}</Td>
                      <Td>{formatCurrency(Number(o.totalAmount))}</Td>
                      <Td>
                        <Badge variant={STATUS_COLORS[o.status] ?? "muted"}>
                          {o.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Link href={`/sales/orders/${o.id}`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
