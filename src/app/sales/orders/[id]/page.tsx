import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getSalesOrderDetail } from "@/server/services/sales-service";
import { getProductDropdownList } from "@/server/services/product-service";
import PageHeader from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  addSalesOrderItem,
  updateSalesOrderStatus,
  deleteSalesOrder,
} from "../actions";
import AddOrderItemForm from "./add-item-form";

const STATUS_COLORS = {
  draft: "muted",
  confirmed: "default",
  invoiced: "success",
  cancelled: "danger",
} as const;

export default async function SalesOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSales) redirect("/403");

  const [order, products] = await Promise.all([
    getSalesOrderDetail(params.id),
    getProductDropdownList(),
  ]);
  if (!order) notFound();

  const isDraft = order.status === "draft";
  const isEditable = isDraft || order.status === "confirmed";

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNo}
        breadcrumbs={[
          { label: "Sales Orders", href: "/sales/orders" },
          { label: order.orderNo, href: `/sales/orders/${order.id}` },
        ]}
      />

      {/* Header Details */}
      <Card>
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Customer</p>
            <p className="font-medium text-white">{order.customer.name}</p>
          </div>
          <div>
            <p className="text-slate-400">Order Date</p>
            <p className="font-medium text-white">{formatDate(order.orderDate)}</p>
          </div>
          <div>
            <p className="text-slate-400">Total Amount</p>
            <p className="font-medium text-white">{formatCurrency(Number(order.totalAmount))}</p>
          </div>
          <div>
            <p className="text-slate-400">Status</p>
            <Badge variant={STATUS_COLORS[order.status] ?? "muted"}>{order.status}</Badge>
          </div>
          {order.notes && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-slate-400">Notes</p>
              <p className="text-white">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
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
          <Link href={`/sales/invoices?salesOrderId=${order.id}`}>
            <Button variant="outline">Create Invoice</Button>
          </Link>
        )}
        {isDraft && order.invoices.length === 0 && (
          <form action={deleteSalesOrder}>
            <input type="hidden" name="id" value={order.id} />
            <Button type="submit" variant="ghost" className="text-red-400">Delete</Button>
          </form>
        )}
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {order.items.length === 0 ? (
            <p className="text-slate-400 text-sm p-4">No items yet.</p>
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
                    <Td className={item.invoicedQty < item.orderedQty ? "text-amber-400" : "text-green-400"}>
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

      {/* Add item form */}
      {isEditable && (
        <AddOrderItemForm
          orderId={order.id}
          products={products}
          addAction={addSalesOrderItem}
        />
      )}

      {/* Linked Invoices */}
      {order.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Invoices</CardTitle>
          </CardHeader>
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
  );
}
