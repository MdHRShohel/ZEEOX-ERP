import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getReturnDetail } from "@/server/services/returns-service";
import { getProductDropdownList } from "@/server/services/product-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addReturnItem, postReturn } from "../actions";
import AddReturnItemForm from "./add-item-form";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

export default async function ReturnDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageReturns) redirect("/403");

  const { id } = await params;
  const [ret, products] = await Promise.all([
    getReturnDetail(id),
    getProductDropdownList(),
  ]);
  if (!ret) notFound();

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4">
          <Link href="/returns" className="text-sm text-slate-500 hover:text-slate-700">← Returns</Link>
        </div>
        <PageHeader
          title={ret.returnNo}
          description={ret.type === "customer_return" ? "Customer Return" : "Supplier Return"}
        />

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Type</p>
            <div className="mt-1">
              <Badge variant={ret.type === "customer_return" ? "default" : "warning"}>
                {ret.type === "customer_return" ? "Customer Return" : "Supplier Return"}
              </Badge>
            </div>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Return Date</p>
            <p className="text-white mt-1">{formatDate(ret.returnDate)}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Total Amount</p>
            <p className="font-semibold text-white mt-1">{formatCurrency(Number(ret.totalAmount))}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-slate-400 text-xs">Status</p>
            <div className="mt-1">
              <Badge variant={ret.isPosted ? "success" : "muted"}>
                {ret.isPosted ? "Posted" : "Draft"}
              </Badge>
            </div>
          </div>
          {ret.salesInvoice && (
            <div className="bg-slate-800 rounded p-3 col-span-2">
              <p className="text-slate-400 text-xs">Linked Invoice</p>
              <div className="flex items-center gap-2 mt-1">
                <Link href={`/sales/invoices/${ret.salesInvoice.id}`} className="text-blue-400 hover:underline">
                  View Invoice
                </Link>
                <span className="text-slate-500">— {ret.salesInvoice.customer.name}</span>
              </div>
            </div>
          )}
          {ret.reason && (
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs">Reason</p>
              <p className="text-white mt-1">{ret.reason}</p>
            </div>
          )}
        </div>

        {/* Post Action */}
        {!ret.isPosted && (
          <div className="mb-6">
            <form action={postReturn}>
              <input type="hidden" name="id" value={ret.id} />
              <Button type="submit">Post Return</Button>
            </form>
          </div>
        )}

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Return Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            {ret.items.length === 0 ? (
              <p className="text-slate-500 text-sm p-4">No items yet.</p>
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

        {!ret.isPosted && (
          <AddReturnItemForm returnId={ret.id} products={products} addAction={addReturnItem} />
        )}
      </div>
    </AppShell>
  );
}
