import { ModulePage } from "@/components/layout/module-page";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getPermissions, getSessionUser } from "@/lib/auth";
import { getAuditLogs } from "@/server/services/audit-service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams
}: {
  searchParams?: { q?: string; entity?: string; action?: string };
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const permissions = getPermissions(user.role);
  const search = String(searchParams?.q ?? "");
  const entity = String(searchParams?.entity ?? "");
  const action = String(searchParams?.action ?? "");
  const logs = await getAuditLogs({ search, entity, action, limit: 100 });

  return (
    <ModulePage
      title="Audit Log"
      description="Track create, update, and delete actions across the business system."
      stats={[
        { label: "Entries", value: logs.length, help: "Recent audit records" },
        { label: "Access", value: permissions.canDeleteRecords ? "Admin" : "Read-only", help: "Role controlled" }
      ]}
      items={[
        { title: "Traceability", detail: "Who changed what and when." },
        { title: "Operational review", detail: "Catch unexpected updates or deletes quickly." },
        { title: "Support workflow", detail: "Use logs to troubleshoot record issues." }
      ]}
    >
      <Card>
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]" action="/audit" method="get">
            <div className="space-y-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={search} placeholder="Entity or action" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity">Entity</Label>
              <Input id="entity" name="entity" defaultValue={entity} placeholder="company, salesInvoice" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Input id="action" name="action" defaultValue={action} placeholder="create, update" />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Filter</Button>
              {(search || entity || action) ? (
                <a className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200" href="/audit">
                  Reset
                </a>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-600">No audit events found.</p>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="rounded-xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.entity}</p>
                    <p className="text-sm text-slate-600">{entry.action}</p>
                  </div>
                  <p className="text-xs text-slate-500">{entry.createdAt.toLocaleString()}</p>
                </div>
                {entry.payload ? (
                  <pre className="mt-3 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-600">
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
