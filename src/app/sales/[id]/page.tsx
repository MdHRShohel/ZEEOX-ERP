import { ModulePage } from "@/components/layout/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getPermissions, getSessionUser } from "@/lib/auth";
import { uploadAttachment } from "@/app/attachments/actions";
import { getSalesInvoiceDetail } from "@/server/services/operations-service";
import { deleteSalesInvoice, updateSalesInvoice } from "@/app/sales/actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { paymentStatuses } from "@/lib/constants";

export default async function SalesDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const invoice = await getSalesInvoiceDetail(params.id);

  if (!invoice) notFound();
  const attachments = await prisma.attachment.findMany({
    where: { entityType: "salesInvoice", entityId: invoice.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <ModulePage title={invoice.invoiceNo} description="Sales invoice detail view.">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Invoice summary</CardTitle>
            <p className="text-sm text-slate-600">
              {permissions.canManageOperations
                ? "Edit the invoice here, then open the printable PDF view."
                : "You can view and download the invoice, but edits are locked."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/sales/${invoice.id}/invoice/pdf`}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Download invoice PDF
            </Link>
            <Link
              href="/sales"
              className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
            >
              Back to sales
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>Customer: {invoice.customer?.name ?? "Walk-in customer"}</p>
          <p>Date: {invoice.invoiceDate.toLocaleDateString()}</p>
          <p>Payment: {invoice.paymentStatus}</p>
          <p>Sale: {Number(invoice.totalSale).toLocaleString("en-US")}</p>
          <p>Profit: {Number(invoice.netProfit).toLocaleString("en-US")}</p>
        </CardContent>
      </Card>
      {permissions.canManageOperations ? (
        <Card>
          <CardHeader>
            <CardTitle>Manage invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateSalesInvoice} className="grid gap-4">
              <input type="hidden" name="id" value={invoice.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNo">Invoice no</Label>
                  <Input id="invoiceNo" name="invoiceNo" defaultValue={invoice.invoiceNo} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice date</Label>
                  <Input id="invoiceDate" name="invoiceDate" type="date" defaultValue={invoice.invoiceDate.toISOString().slice(0, 10)} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer name</Label>
                  <Input id="customerName" name="customerName" defaultValue={invoice.customer?.name ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerMobile">Customer mobile</Label>
                  <Input id="customerMobile" name="customerMobile" defaultValue={invoice.customer?.mobile ?? ""} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productVariantId">Product variant ID</Label>
                  <Input id="productVariantId" name="productVariantId" defaultValue={invoice.items[0]?.productVariantId ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment status</Label>
                  <Select id="paymentStatus" name="paymentStatus" defaultValue={invoice.paymentStatus} required>
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
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" step="1" defaultValue={invoice.items[0]?.quantity ?? 1} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling price</Label>
                  <Input id="sellingPrice" name="sellingPrice" type="number" min="0" step="0.01" defaultValue={invoice.items[0]?.sellingPrice?.toString() ?? "0"} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productionCostUnit">Production cost/unit</Label>
                  <Input id="productionCostUnit" name="productionCostUnit" type="number" min="0" step="0.01" defaultValue={invoice.items[0]?.productionCostUnit?.toString() ?? "0"} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="courierCost">Courier cost</Label>
                  <Input id="courierCost" name="courierCost" type="number" min="0" step="0.01" defaultValue={invoice.items[0]?.courierCost?.toString() ?? "0"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adsCost">Ads cost</Label>
                  <Input id="adsCost" name="adsCost" type="number" min="0" step="0.01" defaultValue={invoice.items[0]?.adsCost?.toString() ?? "0"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packagingCost">Packaging cost</Label>
                  <Input id="packagingCost" name="packagingCost" type="number" min="0" step="0.01" defaultValue={invoice.items[0]?.packagingCost?.toString() ?? "0"} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">Save changes</Button>
                <Button type="submit" formAction={deleteSalesInvoice} variant="destructive">
                  Delete invoice
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {attachments.length === 0 ? <p className="text-sm text-slate-600">No attachments yet.</p> : attachments.map((attachment) => (
            <a key={attachment.id} href={attachment.fileUrl} className="rounded-xl border bg-slate-50 p-4 text-sm hover:bg-slate-100" target="_blank" rel="noreferrer">
              {attachment.originalName}
            </a>
          ))}
          {permissions.canManageOperations ? (
            <form action={uploadAttachment} encType="multipart/form-data" className="grid gap-3 border-t pt-4">
              <input type="hidden" name="entityType" value="salesInvoice" />
              <input type="hidden" name="entityId" value={invoice.id} />
              <div className="space-y-2">
                <Label htmlFor="file">Upload proof</Label>
                <Input id="file" name="file" type="file" />
              </div>
              <Button type="submit">Upload</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
