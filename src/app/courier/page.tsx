import { createCourierShipment, deleteCourierShipment, updateCourierShipment } from "@/app/courier/actions";
import { ModulePage } from "@/components/layout/module-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { courierStatuses } from "@/lib/constants";
import { getCourierOverview, hasOperationsDatabase, getSalesInvoices } from "@/server/services/operations-service";
import { getPermissions, getSessionUser } from "@/lib/auth";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function CourierPage({
  searchParams
}: {
  searchParams?: { q?: string; status?: string };
}) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const search = String(searchParams?.q ?? "");
  const status = String(searchParams?.status ?? "");
  const [overview, invoices] = await Promise.all([
    getCourierOverview({ search, status }),
    getSalesInvoices()
  ]);

  return (
    <ModulePage
      title="Courier Management"
      description="Track dispatch status, tracking IDs, delivery charges, COD charges, and return charges."
      stats={[
        { label: "Shipments", value: overview.shipmentCount, help: "Courier records" },
        { label: "Delivered", value: overview.deliveredCount, help: "Completed deliveries" },
        { label: "Returned", value: overview.returnCount, help: "Return logistics" },
        { label: "Courier Cost", value: overview.courierCost.toLocaleString("en-US"), help: "Charge rollup" }
      ]}
      items={[
        { title: "Shipment status", detail: "Pending, dispatched, in transit, delivered, returned, failed." },
        { title: "Courier cost", detail: "Delivery + COD + return charges per shipment." },
        { title: "Tracking link", detail: "Connect each shipment to a sales invoice." }
      ]}
    >
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[1fr_180px_auto_auto]" action="/courier" method="get">
            <div className="space-y-2">
              <Label htmlFor="q">Search shipments</Label>
              <Input id="q" name="q" defaultValue={search} placeholder="Courier, tracking, invoice" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="">All</option>
                {courierStatuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>
            <Button type="submit">Search</Button>
            {search || status ? (
              <Link href="/courier" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                Reset
              </Link>
            ) : null}
          </form>
          <div className="text-sm text-slate-500">{overview.shipmentCount} shipments</div>
        </CardContent>
      </Card>

      {!hasOperationsDatabase() ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-slate-900">DATABASE_URL not configured</p>
            <p className="mt-1 text-sm text-slate-600">Add a PostgreSQL connection string to enable courier CRUD and shipment tracking.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {permissions.canManageOperations ? (
          <FormSection title="Create courier shipment">
            <form action={createCourierShipment} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesInvoiceId">Sales invoice</Label>
              <Select id="salesInvoiceId" name="salesInvoiceId">
                <option value="">Optional invoice</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNo} ({inv.customer?.name ?? "Walk-in"})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipmentDate">Shipment date</Label>
              <Input id="shipmentDate" name="shipmentDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courierName">Courier name</Label>
              <Input id="courierName" name="courierName" placeholder="Pathao / Steadfast" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trackingId">Tracking ID</Label>
                <Input id="trackingId" name="trackingId" placeholder="optional tracking id" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue="pending" required>
                  {courierStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="deliveryCharge">Delivery charge</Label>
                <Input id="deliveryCharge" name="deliveryCharge" type="number" min="0" step="0.01" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codCharge">COD charge</Label>
                <Input id="codCharge" name="codCharge" type="number" min="0" step="0.01" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnCharge">Return charge</Label>
                <Input id="returnCharge" name="returnCharge" type="number" min="0" step="0.01" defaultValue={0} />
              </div>
            </div>
              <Button type="submit">Save shipment</Button>
            </form>
          </FormSection>
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">You have read-only access to courier records.</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Courier shipments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.shipments.length === 0 ? (
              <p className="text-sm text-slate-600">No courier shipments configured yet.</p>
            ) : (
                overview.shipments.slice(0, 6).map((shipment) => (
                  <div key={shipment.id} className="rounded-xl border bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{shipment.courierName}</p>
                        <p className="text-sm text-slate-600">{shipment.status} · {shipment.salesInvoice?.invoiceNo ?? "No invoice"}</p>
                      </div>
                      <Badge>{(Number(shipment.deliveryCharge) + Number(shipment.codCharge) + Number(shipment.returnCharge)).toLocaleString("en-US")}</Badge>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Link href={`/courier/${shipment.id}`} className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                        Details
                      </Link>
                    </div>
                    {permissions.canManageOperations ? (
                    <form action={updateCourierShipment} className="mt-4 grid gap-3 border-t pt-4">
                      <input type="hidden" name="id" value={shipment.id} />
                      <div className="space-y-2">
                        <Label htmlFor={`salesInvoiceId-${shipment.id}`}>Sales invoice</Label>
                        <Select id={`salesInvoiceId-${shipment.id}`} name="salesInvoiceId" defaultValue={shipment.salesInvoiceId ?? ""}>
                          <option value="">Optional invoice</option>
                          {invoices.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.invoiceNo} ({inv.customer?.name ?? "Walk-in"})
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`shipmentDate-${shipment.id}`}>Shipment date</Label>
                        <Input id={`shipmentDate-${shipment.id}`} name="shipmentDate" type="date" defaultValue={shipment.shipmentDate.toISOString().slice(0, 10)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`courierName-${shipment.id}`}>Courier name</Label>
                        <Input id={`courierName-${shipment.id}`} name="courierName" defaultValue={shipment.courierName} required />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`trackingId-${shipment.id}`}>Tracking ID</Label>
                          <Input id={`trackingId-${shipment.id}`} name="trackingId" defaultValue={shipment.trackingId ?? ""} placeholder="optional tracking id" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`status-${shipment.id}`}>Status</Label>
                          <Select id={`status-${shipment.id}`} name="status" defaultValue={shipment.status} required>
                            {courierStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor={`deliveryCharge-${shipment.id}`}>Delivery charge</Label>
                          <Input id={`deliveryCharge-${shipment.id}`} name="deliveryCharge" type="number" min="0" step="0.01" defaultValue={shipment.deliveryCharge.toString()} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`codCharge-${shipment.id}`}>COD charge</Label>
                          <Input id={`codCharge-${shipment.id}`} name="codCharge" type="number" min="0" step="0.01" defaultValue={shipment.codCharge.toString()} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`returnCharge-${shipment.id}`}>Return charge</Label>
                          <Input id={`returnCharge-${shipment.id}`} name="returnCharge" type="number" min="0" step="0.01" defaultValue={shipment.returnCharge.toString()} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Update</Button>
                        <Button type="submit" formAction={deleteCourierShipment} variant="destructive" size="sm">Delete</Button>
                      </div>
                    </form>
                    ) : null}
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  );
}
