import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getAuditLogs } from "@/server/services/audit-service";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_COLORS = {
  create: "success",
  update: "default",
  delete: "danger",
  post: "warning",
} as const;

const ENTITY_TYPES = [
  "User", "ProductVariant", "ProductCategory", "Supplier", "Customer",
  "Warehouse", "PurchaseOrder", "GoodsReceipt", "SalesOrder", "SalesInvoice",
  "StockTransfer", "Return",
];

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { entityType?: string; from?: string; to?: string; page?: string };
}) {
  const session = await requireSession();
  if (!getPermissions(session.role).canViewAudit) redirect("/403");

  const { logs, total, page, pages } = await getAuditLogs({
    entityType: searchParams.entityType,
    from: searchParams.from,
    to: searchParams.to,
    page: Number(searchParams.page ?? 1),
  });

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Audit Log" />

        <form method="GET" className="flex flex-wrap gap-3 mb-4">
          <select
            name="entityType"
            defaultValue={searchParams.entityType ?? ""}
            className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All Entity Types</option>
            {ENTITY_TYPES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <input type="date" name="from" defaultValue={searchParams.from}
            className="border border-slate-300 rounded px-3 py-2 text-sm" />
          <input type="date" name="to" defaultValue={searchParams.to}
            className="border border-slate-300 rounded px-3 py-2 text-sm" />
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded text-sm hover:bg-slate-700">
            Filter
          </button>
          <Link href="/audit" className="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50">
            Reset
          </Link>
        </form>

        <p className="text-slate-500 text-sm mb-4">{total} records found</p>

        <Card>
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <EmptyState title="No audit logs" description="Actions will appear here as users interact with the system." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Date & Time</Th>
                      <Th>Entity Type</Th>
                      <Th>Entity ID</Th>
                      <Th>Action</Th>
                      <Th>Actor</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {logs.map((log) => (
                      <Tr key={log.id}>
                        <Td className="text-sm text-slate-600">{formatDateTime(log.createdAt)}</Td>
                        <Td className="font-medium">{log.entityType}</Td>
                        <Td className="font-mono text-xs text-slate-400">…{log.entityId.slice(-8)}</Td>
                        <Td>
                          <Badge variant={ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] ?? "muted"}>
                            {log.action}
                          </Badge>
                        </Td>
                        <Td className="text-slate-600">{log.actorName ?? "—"}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {pages > 1 && (
          <div className="flex gap-2 justify-center mt-4 text-sm">
            {page > 1 && (
              <Link href={`/audit?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">
                Prev
              </Link>
            )}
            <span className="px-3 py-1 text-slate-500">Page {page} of {pages}</span>
            {page < pages && (
              <Link href={`/audit?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
