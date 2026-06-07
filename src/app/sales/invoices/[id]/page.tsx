import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSalesInvoiceDetail } from "@/server/services/sales-service";
import { getProductDropdownList } from "@/server/services/product-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  addSalesInvoiceItem,
  postSalesInvoice,
  recordPayment,
  cancelSalesInvoice,
} from "../actions";
import AddInvoiceItemForm from "./add-item-form";
import RecordPaymentForm from "./record-payment-form";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

const STATUS_COLORS = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
  cancelled: "muted",
} as const;

export default async function SalesInvoiceDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSales) redirect("/403");

  const { id } = await params;
  const [invoice, products] = await Promise.all([
    getSalesInvoiceDetail(id),
    getProductDropdownList(),
  ]);
  if (!invoice) notFound();

  const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  const isActive = invoice.status !== "cancelled";

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4">
          <Link href="/sales/invoices" className="text-sm text-slate-500 hover:text-slate-700">← Sales Invoices</Link>
        </div>
        <PageHeader
          title={invoice.invoiceNo}
          description={`${invoice.customer.name} — ${formatDate(invoice.invoiceDate)}`}
          action={
            <Link href={`/sales/invoices/${invoice.id}/pdf`} target="_blank">
              <Button variant="outline" size="sm">Print / PDF</Button>
            </Link>
          }
        />

        {/* Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Status</p>
            <div className="mt-1">
              <Badge variant={STATUS_COLORS[invoice.status] ?? "muted"}>{invoice.status}</Badge>
            </div>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Total</p>
            <p className="font-semibold text-white mt-1 text-base">{formatCurrency(Number(invoice.totalAmount))}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Paid</p>
            <p className="font-medium text-green-400 mt-1">{formatCurrency(Number(invoice.paidAmount))}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Balance</p>
            <p className={`font-semibold mt-1 text-base ${balance > 0 ? "text-red-500" : "text-green-500"}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Discount</p>
            <p className="text-white mt-1">{formatCurrency(Number(invoice.discountAmt))}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Due Date</p>
            <p className="text-white mt-1">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
          </div>
          {invoice.salesOrder && (
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs">Sales Order</p>
              <Link href={`/sales/orders/${invoice.salesOrder.id}`} className="text-blue-400 hover:underline mt-1 block">
                {invoice.salesOrder.orderNo}
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        {isActive && (
          <div className="flex gap-2 flex-wrap mb-6">
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
              <Button type="submit" variant="outline" className="text-red-500">Cancel Invoice</Button>
            </form>
          </div>
        )}

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            {invoice.items.length === 0 ? (
              <p className="text-slate-500 text-sm p-4">No items yet.</p>
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
                      <Td className="text-slate-500">{formatCurrency(Number(item.costPrice))}</Td>
                      <Td className="font-medium">{formatCurrency(Number(item.lineTotal))}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        {!invoice.isPosted && isActive && (
          <AddInvoiceItemForm invoiceId={invoice.id} products={products} addAction={addSalesInvoiceItem} />
        )}

        {/* Returns */}
        {invoice.returns.length > 0 && (
          <Card className="mt-6">
            <CardHeader><CardTitle>Returns</CardTitle></CardHeader>
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
    </AppShell>
  );
}
