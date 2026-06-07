import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getReturns, getReturnStats } from "@/server/services/returns-service";
import PageHeader from "@/components/layout/page-header";
import ModuleStats from "@/components/layout/module-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import EmptyState from "@/components/ui/empty-state";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import CreateReturnForm from "./create-form";

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageReturns) redirect("/403");

  const [returns, stats] = await Promise.all([
    getReturns(searchParams),
    getReturnStats(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        breadcrumbs={[{ label: "Returns", href: "/returns" }]}
        action={<CreateReturnForm />}
      />

      <ModuleStats
        stats={[
          { label: "Total Returns", value: stats.total },
          { label: "Customer Returns", value: stats.customer },
          { label: "Supplier Returns", value: stats.supplier },
          { label: "Total Value", value: formatCurrency(stats.totalValue) },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          {returns.length === 0 ? (
            <EmptyState title="No returns" description="No return records found." />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Return No</Th>
                  <Th>Type</Th>
                  <Th>Invoice / Ref</Th>
                  <Th>Date</Th>
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {returns.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-mono text-sm">{r.returnNo}</Td>
                    <Td>
                      <Badge variant={r.type === "customer_return" ? "default" : "warning"}>
                        {r.type === "customer_return" ? "Customer" : "Supplier"}
                      </Badge>
                    </Td>
                    <Td className="text-sm text-slate-400">
                      {r.salesInvoice?.customer.name ?? "—"}
                    </Td>
                    <Td>{formatDate(r.returnDate)}</Td>
                    <Td>{r._count.items}</Td>
                    <Td>{formatCurrency(Number(r.totalAmount))}</Td>
                    <Td>
                      <Badge variant={r.isPosted ? "success" : "muted"}>
                        {r.isPosted ? "Posted" : "Draft"}
                      </Badge>
                    </Td>
                    <Td>
                      <Link href={`/returns/${r.id}`}>
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
  );
}
