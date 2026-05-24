import { createSalesInvoice } from "@/app/sales/actions";
import { ModulePage } from "@/components/layout/module-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { paymentStatuses } from "@/lib/constants";
import { getSalesOverview, hasOperationsDatabase } from "@/server/services/operations-service";
import { getProductVariants } from "@/server/services/inventory-service";
import { getPermissions, getSessionUser } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams
}: {
  searchParams?: { q?: string; status?: string };
}) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const search = String(searchParams?.q ?? "");
  const status = String(searchParams?.status ?? "");
  const [overview, variants] = await Promise.all([
    getSalesOverview({ search, status }),
    getProductVariants()
  ]);

  return (
    <ModulePage
      title="Sales & Profit"
      description="Manage invoices, customer details, payment status, costs, returns, and net profit."
      stats={[
        { label: "Invoices", value: overview.invoiceCount, help: "Sales records" },
        { label: "Total Sale", value: overview.totalSale.toLocaleString("en-US"), help: "Gross invoiced amount" },
        { label: "Total Cost", value: overview.totalCost.toLocaleString("en-US"), help: "Cost stack" },
        { label: "Net Profit", value: overview.netProfit.toLocaleString("en-US"), help: "After cost stack" }
      ]}
      items={[
        { title: "Invoice ledger", detail: "Unique invoice number, sale total, total cost, and profit." },
        { title: "Payment tracking", detail: "Support unpaid, partial, paid, returned, and cancelled states." },
        { title: "Return logic", detail: "Capture return courier fees for customer and company." }
      ]}
      >
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {permissions.canManageOperations ? "Invoice management enabled" : "Read-only sales access"}
            </p>
            <p className="text-sm text-slate-600">
              {permissions.canManageOperations
                ? "Create invoices here, then open the detail page to edit or print a clean PDF."
                : "You can review sales and open printable invoices, but edits stay locked."}
            </p>
          </div>
          <Badge className={permissions.canManageOperations ? "bg-slate-900 text-white" : ""}>
            {permissions.canManageOperations ? "Manage" : "Viewer"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[1fr_180px_auto_auto]" action="/sales" method="get">
            <div className="space-y-2">
              <Label htmlFor="q">Search invoices</Label>
              <Input id="q" name="q" defaultValue={search} placeholder="Invoice, customer, product" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Payment status</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="">All</option>
                {paymentStatuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>
            <Button type="submit">Search</Button>
            {search || status ? (
              <Link href="/sales" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                Reset
              </Link>
            ) : null}
          </form>
          <div className="text-sm text-slate-500">{overview.invoiceCount} invoices</div>
        </CardContent>
      </Card>

      {!hasOperationsDatabase() ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-slate-900">DATABASE_URL not configured</p>
            <p className="mt-1 text-sm text-slate-600">Add a PostgreSQL connection string to enable sales invoice CRUD and stock deduction.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {permissions.canManageOperations ? (
          <Card>
            <CardHeader>
              <CardTitle>Create sales invoice</CardTitle>
            </CardHeader>
            <CardContent>
            <form action={createSalesInvoice} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Invoice no</Label>
              <Input id="invoiceNo" name="invoiceNo" placeholder="INV-0001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice date</Label>
              <Input id="invoiceDate" name="invoiceDate" type="date" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer name</Label>
                <Input id="customerName" name="customerName" placeholder="Optional new customer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerMobile">Customer mobile</Label>
                <Input id="customerMobile" name="customerMobile" placeholder="Optional mobile" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productVariantId">Product variant</Label>
              <Select id="productVariantId" name="productVariantId" required>
                <option value="">Select variant</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.category.name} · {v.model} ({v.color || "No color"} / {v.size || "No size"})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" min="1" step="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling price</Label>
                <Input id="sellingPrice" name="sellingPrice" type="number" min="0" step="0.01" required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="productionCostUnit">Production cost/unit</Label>
                <Input id="productionCostUnit" name="productionCostUnit" type="number" min="0" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment status</Label>
                <Select id="paymentStatus" name="paymentStatus" defaultValue="paid" required>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="courierCost">Courier cost</Label>
                <Input id="courierCost" name="courierCost" type="number" min="0" step="0.01" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adsCost">Ads cost</Label>
                <Input id="adsCost" name="adsCost" type="number" min="0" step="0.01" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packagingCost">Packaging cost</Label>
                <Input id="packagingCost" name="packagingCost" type="number" min="0" step="0.01" defaultValue={0} />
              </div>
            </div>
            <p className="text-xs text-slate-500">Totals are calculated on the server from quantity, price, and cost inputs.</p>
              <Button type="submit">Save invoice</Button>
            </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">You have read-only access to sales records.</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Sales invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.invoices.length === 0 ? (
              <p className="text-sm text-slate-600">No sales invoices configured yet.</p>
            ) : (
                overview.invoices.slice(0, 6).map((invoice) => {
                  return (
                  <div key={invoice.id} className="rounded-xl border bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{invoice.invoiceNo}</p>
                        <p className="text-sm text-slate-600">
                          {invoice.customer?.name ?? "Walk-in customer"} · {invoice.paymentStatus} ·{" "}
                          {invoice.items.length} item{invoice.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Badge>{Number(invoice.netProfit).toLocaleString("en-US")}</Badge>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/sales/${invoice.id}/invoice/pdf`} className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                          Download PDF
                        </Link>
                        <Link href={`/sales/${invoice.id}`} className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  );
}
