import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePage } from "@/components/layout/module-page";
import { InvoiceToolbar } from "@/components/sales/invoice-toolbar";
import { getSalesInvoiceDetail } from "@/server/services/operations-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SalesInvoicePage({ params }: { params: { id: string } }) {
  const invoice = await getSalesInvoiceDetail(params.id);

  if (!invoice) notFound();

  return (
    <ModulePage
      title={`Invoice ${invoice.invoiceNo}`}
      description="Printable invoice view optimized for Save as PDF and browser print."
      toolbar={null}
    >
      <Card className="print-page print:border-0 print:shadow-none">
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sales invoice</p>
            <CardTitle className="text-2xl">{invoice.invoiceNo}</CardTitle>
            <p className="text-sm text-slate-600">Generated for {invoice.customer?.name ?? "Walk-in customer"}</p>
          </div>
          <InvoiceToolbar backHref={`/sales/${invoice.id}`} downloadHref={`/sales/${invoice.id}/invoice/pdf`} />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice date</p>
              <p className="mt-1 text-sm font-medium">{invoice.invoiceDate.toLocaleDateString()}</p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment status</p>
              <div className="mt-2">
                <Badge>{invoice.paymentStatus}</Badge>
              </div>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
              <p className="mt-1 text-sm font-medium">{invoice.customer?.name ?? "Walk-in customer"}</p>
              <p className="text-sm text-slate-600">{invoice.customer?.mobile ?? "No mobile recorded"}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Sale</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-medium">{entry.productVariant.model}</p>
                      <p className="text-xs text-slate-500">{entry.productVariant.sku}</p>
                    </td>
                    <td className="px-4 py-3">{entry.productVariant.category?.name ?? "Uncategorized"}</td>
                    <td className="px-4 py-3">{entry.quantity}</td>
                    <td className="px-4 py-3">{Number(entry.totalSale).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3">{Number(entry.totalCost).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3">{Number(entry.netProfit).toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total sale</p>
              <p className="mt-1 text-2xl font-semibold">{Number(invoice.totalSale).toLocaleString("en-US")}</p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total cost</p>
              <p className="mt-1 text-2xl font-semibold">{Number(invoice.totalCost).toLocaleString("en-US")}</p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net profit</p>
              <p className="mt-1 text-2xl font-semibold">{Number(invoice.netProfit).toLocaleString("en-US")}</p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            This view is optimized for printing or downloading as PDF from the browser.
          </p>
        </CardContent>
      </Card>
    </ModulePage>
  );
}
