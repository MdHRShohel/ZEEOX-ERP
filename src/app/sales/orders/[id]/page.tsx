import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSalesOrderDetail } from "@/server/services/sales-service";
import { getProductDropdownList } from "@/server/services/product-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  addSalesOrderItem,
  updateSalesOrderStatus,
  deleteSalesOrder,
} from "../actions";
import AddOrderItemForm from "./add-item-form";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

const STATUS_COLORS = {
  draft: "muted",
  confirmed: "default",
  invoiced: "success",
  cancelled: "danger",
} as const;

export default async function SalesOrderDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSales) redirect("/403");

  const { id } = await params;
  const [order, products] = await Promise.all([
    getSalesOrderDetail(id),
    getProductDropdownList(),
  ]);
  if (!order) notFound();

  const isDraft = order.status === "draft";
  const isEditable = isDraft || order.status === "confirmed";

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4">
          <Link href="/sales/orders" className="text-sm text-slate-500 hover:text-slate-700">← Sales Orders</Link>
        </div>
        <PageHeader
          title={order.orderNo}
          description={`${order.customer.name} — ${formatDate(order.orderDate)}`}
        />

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Customer</p>
            <p className="font-medium text-white mt-1">{order.customer.name}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Total</p>
            <p className="font-medium text-white mt-1">{formatCurrency(Number(order.totalAmount))}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Status</p>
            <div className="mt-1">
              <Badge variant={STATUS_COLORS[order.status] ?? "muted"}>{order.status}</Badge>
            </div>
          </div>
          {order.notes && (
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs">Notes</p>
              <p className="text-white mt-1 text-xs">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap mb-6">
          {isDraft && (
            <form action={updateSalesOrderStatus}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value="confirmed" />
              <Button type="submit">Confirm Order</Button>
            </form>
          )}
          {(isDraft || order.status === "confirmed") && (
            <form action={updateSalesOrderStatus}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value="cancelled" />
              <Button type="submit" variant="outline">Cancel Order</Button>
            </form>
          )}
          {order.status === "confirmed" && (
            <Link href="/sales/invoices">
              <Button variant="outline">Create Invoice</Button>
            </Link>
          )}
          {isDraft && order.invoices.length === 0 && (
            <form action={deleteSalesOrder}>
              <input type="hidden" name="id" value={order.id} />
              <Button type="submit" variant="ghost" className="text-red-500">Delete</Button>
            </form>
          )}
        </div>

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            {order.items.length === 0 ? (
              <p className="text-slate-500 text-sm p-4">No items yet.</p>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>SKU</Th>
                    <Th>Product</Th>
                    <Th>UoM</Th>
                    <Th>Ordered Qty</Th>
                    <Th>Invoiced Qty</Th>
                    <Th>Unit Price</Th>
                    <Th>Line Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {order.items.map((item) => (
                    <Tr key={item.id}>
                      <Td className="font-mono text-sm">{item.productVariant.sku}</Td>
                      <Td>{item.productVariant.name}</Td>
                      <Td>{item.productVariant.uom.abbreviation}</Td>
                      <Td>{item.orderedQty}</Td>
                      <Td className={item.invoicedQty < item.orderedQty ? "text-yellow-600" : "text-green-600"}>
                        {item.invoicedQty}
                      </Td>
                      <Td>{formatCurrency(Number(item.unitPrice))}</Td>
                      <Td>{formatCurrency(item.orderedQty * Number(item.unitPrice))}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        {isEditable && (
          <AddOrderItemForm orderId={order.id} products={products} addAction={addSalesOrderItem} />
        )}

        {/* Linked Invoices */}
        {order.invoices.length > 0 && (
          <Card className="mt-6">
            <CardHeader><CardTitle>Linked Invoices</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Invoice No</Th>
                    <Th>Date</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {order.invoices.map((inv) => (
                    <Tr key={inv.id}>
                      <Td className="font-mono text-sm">{inv.invoiceNo}</Td>
                      <Td>{formatDate(inv.invoiceDate)}</Td>
                      <Td>{formatCurrency(Number(inv.totalAmount))}</Td>
                      <Td><Badge variant="muted">{inv.status}</Badge></Td>
                      <Td>
                        <Link href={`/sales/invoices/${inv.id}`}>
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
