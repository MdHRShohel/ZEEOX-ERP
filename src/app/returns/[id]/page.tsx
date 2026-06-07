import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getReturnDetail } from "@/server/services/returns-service";
import { getProductDropdownList } from "@/server/services/product-service";
import PageHeader from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addReturnItem, postReturn } from "../actions";
import AddReturnItemForm from "./add-item-form";

export default async function ReturnDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageReturns) redirect("/403");

  const [ret, products] = await Promise.all([
    getReturnDetail(params.id),
    getProductDropdownList(),
  ]);
  if (!ret) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={ret.returnNo}
        breadcrumbs={[
          { label: "Returns", href: "/returns" },
          { label: ret.returnNo, href: `/returns/${ret.id}` },
        ]}
      />

      {/* Header Details */}
      <Card>
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Type</p>
            <Badge variant={ret.type === "customer_return" ? "default" : "warning"}>
              {ret.type === "customer_return" ? "Customer Return" : "Supplier Return"}
            </Badge>
          </div>
          <div>
            <p className="text-slate-400">Return Date</p>
            <p className="font-medium text-white">{formatDate(ret.returnDate)}</p>
          </div>
          <div>
            <p className="text-slate-400">Total Amount</p>
            <p className="font-medium text-white">{formatCurrency(Number(ret.totalAmount))}</p>
          </div>
          <div>
            <p className="text-slate-400">Status</p>
            <Badge variant={ret.isPosted ? "success" : "muted"}>
              {ret.isPosted ? "Posted" : "Draft"}
            </Badge>
          </div>
          {ret.salesInvoice && (
            <div>
              <p className="text-slate-400">Linked Invoice</p>
              <Link href={`/sales/invoices/${ret.salesInvoice.id}`} className="text-blue-400 hover:underline">
                {ret.salesInvoice.id}
              </Link>
              <span className="text-slate-400 ml-2">({ret.salesInvoice.customer.name})</span>
            </div>
          )}
          {ret.reason && (
            <div>
              <p className="text-slate-400">Reason</p>
              <p className="text-white">{ret.reason}</p>
            </div>
          )}
          {ret.notes && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-slate-400">Notes</p>
              <p className="text-white">{ret.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Action */}
      {!ret.isPosted && (
        <form action={postReturn}>
          <input type="hidden" name="id" value={ret.id} />
          <Button type="submit">Post Return</Button>
        </form>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Return Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ret.items.length === 0 ? (
            <p className="text-slate-400 text-sm p-4">No items yet.</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>SKU</Th>
                  <Th>Product</Th>
                  <Th>UoM</Th>
                  <Th>Quantity</Th>
                  <Th>Unit Price</Th>
                  <Th>Line Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ret.items.map((item) => (
                  <Tr key={item.id}>
                    <Td className="font-mono text-sm">{item.productVariant.sku}</Td>
                    <Td>{item.productVariant.name}</Td>
                    <Td>{item.productVariant.uom.abbreviation}</Td>
                    <Td>{item.quantity}</Td>
                    <Td>{formatCurrency(Number(item.unitPrice))}</Td>
                    <Td>{formatCurrency(item.quantity * Number(item.unitPrice))}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add item form — only before posting */}
      {!ret.isPosted && (
        <AddReturnItemForm
          returnId={ret.id}
          products={products}
          addAction={addReturnItem}
        />
      )}
    </div>
  );
}
