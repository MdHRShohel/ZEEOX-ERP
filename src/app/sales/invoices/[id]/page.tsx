import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getSalesInvoiceDetail } from "@/server/services/sales-service";
import { getProductDropdownList } from "@/server/services/product-service";
import PageHeader from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  addSalesInvoiceItem,
  postSalesInvoice,
  recordPayment,
  cancelSalesInvoice,
} from "../actions";
import AddInvoiceItemForm from "./add-item-form";
import RecordPaymentForm from "./record-payment-form";

const STATUS_COLORS = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
  cancelled: "muted",
} as const;

export default async function SalesInvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSales) redirect("/403");

  const [invoice, products] = await Promise.all([
    getSalesInvoiceDetail(params.id),
    getProductDropdownList(),
  ]);
  if (!invoice) notFound();

  const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  const isActive = invoice.status !== "cancelled";

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNo}
        breadcrumbs={[
          { label: "Sales Invoices", href: "/sales/invoices" },
          { label: invoice.invoiceNo, href: `/sales/invoices/${invoice.id}` },
        ]}
        action={
          <Link href={`/sales/invoices/${invoice.id}/pdf`} target="_blank">
            <Button variant="outline" size="sm">Print / PDF</Button>
          </Link>
        }
      />

      {/* Header Details */}
      <Card>
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Customer</p>
            <p className="font-medium text-white">{invoice.customer.name}</p>
          </div>
          <div>
            <p className="text-slate-400">Invoice Date</p>
            <p className="font-medium text-white">{formatDate(invoice.invoiceDate)}</p>
          </div>
          <div>
            <p className="text-slate-400">Due Date</p>
            <p className="font-medium text-white">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Status</p>
            <Badge variant={STATUS_COLORS[invoice.status] ?? "muted"}>{invoice.status}</Badge>
          </div>
          <div>
            <p className="text-slate-400">Subtotal</p>
            <p className="font-medium text-white">{formatCurrency(Number(invoice.subtotal))}</p>
          </div>
          <div>
            <p className="text-slate-400">Discount</p>
            <p className="font-medium text-white">{formatCurrency(Number(invoice.discountAmt))}</p>
          </div>
          <div>
            <p className="text-slate-400">Total</p>
            <p className="font-medium text-white text-lg">{formatCurrency(Number(invoice.totalAmount))}</p>
          </div>
          <div>
            <p className="text-slate-400">Balance</p>
            <p className={`font-medium text-lg ${balance > 0 ? "text-red-400" : "text-green-400"}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          {invoice.salesOrder && (
            <div>
              <p className="text-slate-400">Sales Order</p>
              <Link href={`/sales/orders/${invoice.salesOrder.id}`} className="text-blue-400 hover:underline">
                {invoice.salesOrder.orderNo}
              </Link>
            </div>
          )}
          {invoice.notes && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-slate-400">Notes</p>
              <p className="text-white">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {isActive && (
        <div className="flex gap-2 flex-wrap">
          {!invoice.isPosted && (
            <form action={postSalesInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <Button type="submit">Post Invoice</Button>
            </form>
          )}
          {invoice.isPosted && invoice.status !== "paid" && (
            <RecordPaymentForm invoiceId={invoice.id} />
          )}
          <form action={cancelSalesInvoice}>
            <input type="hidden" name="id" value={invoice.id} />
            <Button type="submit" variant="outline" className="text-red-400">Cancel Invoice</Button>
          </form>
        </div>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoice.items.length === 0 ? (
            <p className="text-slate-400 text-sm p-4">No items yet.</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>SKU</Th>
                  <Th>Product</Th>
                  <Th>UoM</Th>
                  <Th>Qty</Th>
                  <Th>Unit Price</Th>
                  <Th>Cost Price</Th>
                  <Th>Line Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {invoice.items.map((item) => (
                  <Tr key={item.id}>
                    <Td className="font-mono text-sm">{item.productVariant.sku}</Td>
                    <Td>{item.productVariant.name}</Td>
                    <Td>{item.productVariant.uom.abbreviation}</Td>
                    <Td>{item.quantity}</Td>
                    <Td>{formatCurrency(Number(item.unitPrice))}</Td>
                    <Td className="text-slate-400">{formatCurrency(Number(item.costPrice))}</Td>
                    <Td>{formatCurrency(Number(item.lineTotal))}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add item form — only before posting */}
      {!invoice.isPosted && isActive && (
        <AddInvoiceItemForm
          invoiceId={invoice.id}
          products={products}
          addAction={addSalesInvoiceItem}
        />
      )}

      {/* Returns */}
      {invoice.returns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Returns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Return No</Th>
                  <Th>Date</Th>
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {invoice.returns.map((ret) => (
                  <Tr key={ret.id}>
                    <Td className="font-mono text-sm">{ret.returnNo}</Td>
                    <Td>{formatDate(ret.returnDate)}</Td>
                    <Td>{ret._count.items}</Td>
                    <Td>{formatCurrency(Number(ret.totalAmount))}</Td>
                    <Td>
                      <Badge variant={ret.isPosted ? "success" : "muted"}>
                        {ret.isPosted ? "Posted" : "Draft"}
                      </Badge>
                    </Td>
                    <Td>
                      <Link href={`/returns/${ret.id}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
