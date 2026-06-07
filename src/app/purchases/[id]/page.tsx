import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, statusVariant } from "@/components/ui/badge";
import { getPurchaseOrderDetail } from "@/server/services/purchase-service";
import { getProductDropdownList } from "@/server/services/product-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addPurchaseOrderItem, removePurchaseOrderItem, updatePurchaseOrderStatus, deletePurchaseOrder } from "../actions";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

export default async function PurchaseOrderDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManagePurchases) redirect("/403");

  const { id } = await params;
  const [po, products] = await Promise.all([
    getPurchaseOrderDetail(id),
    getProductDropdownList(),
  ]);
  if (!po) notFound();

  const isDraft = po.status === "draft";
  const canEdit = ["draft", "confirmed"].includes(po.status);

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4"><Link href="/purchases" className="text-sm text-slate-500 hover:text-slate-700">← Purchase Orders</Link></div>
        <PageHeader
          title={`PO: ${po.poNumber}`}
          description={`${po.supplier.name} — ${po.warehouse.name}`}
          action={
            <Badge variant={statusVariant(po.status)} className="text-sm px-3 py-1">
              {STATUS_LABELS[po.status]}
            </Badge>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Details */}
            <Card>
              <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Supplier:</span> <span className="font-medium ml-1">{po.supplier.name}</span></div>
                  <div><span className="text-slate-500">Warehouse:</span> <span className="font-medium ml-1">{po.warehouse.name}</span></div>
                  <div><span className="text-slate-500">Order Date:</span> <span className="font-medium ml-1">{formatDate(po.orderDate)}</span></div>
                  <div><span className="text-slate-500">Expected:</span> <span className="font-medium ml-1">{po.expectedDate ? formatDate(po.expectedDate) : "—"}</span></div>
                  <div><span className="text-slate-500">Total Amount:</span> <span className="font-bold ml-1 text-slate-900">{formatCurrency(po.totalAmount)}</span></div>
                  {po.notes && <div className="col-span-2"><span className="text-slate-500">Notes:</span> <span className="ml-1">{po.notes}</span></div>}
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
              <CardContent>
                {po.items.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No items yet — add products below</p>
                ) : (
                  <Table>
                    <Thead>
                      <Tr><Th>Product</Th><Th>SKU</Th><Th>Ordered</Th><Th>Received</Th><Th>Remaining</Th><Th>Unit Cost</Th><Th>Line Total</Th>{isDraft && <Th></Th>}</Tr>
                    </Thead>
                    <Tbody>
                      {po.items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.productVariant.name}</Td>
                          <Td className="font-mono text-xs">{item.productVariant.sku}</Td>
                          <Td>{item.orderedQty} {item.productVariant.uom.abbreviation}</Td>
                          <Td className={item.receivedQty > 0 ? "text-green-700" : ""}>{item.receivedQty}</Td>
                          <Td className={item.orderedQty - item.receivedQty > 0 ? "text-amber-600" : "text-green-700"}>
                            {item.orderedQty - item.receivedQty}
                          </Td>
                          <Td>{formatCurrency(item.unitCost)}</Td>
                          <Td>{formatCurrency(item.orderedQty * Number(item.unitCost))}</Td>
                          {isDraft && (
                            <Td>
                              <form action={removePurchaseOrderItem} className="inline">
                                <input type="hidden" name="itemId" value={item.id} />
                                <Button type="submit" variant="ghost" size="sm" className="text-red-600">Remove</Button>
                              </form>
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}

                {canEdit && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-2">Add Item</p>
                    <form action={addPurchaseOrderItem} className="flex gap-2 flex-wrap items-end">
                      <input type="hidden" name="purchaseOrderId" value={po.id} />
                      <div className="flex-1 min-w-40">
                        <label className="text-xs text-slate-500">Product</label>
                        <select name="productVariantId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                          <option value="">Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Qty</label>
                        <input name="orderedQty" type="number" min="1" required placeholder="0" className="mt-1 flex h-9 w-24 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Unit Cost</label>
                        <input name="unitCost" type="number" step="0.01" min="0" required placeholder="0.00" className="mt-1 flex h-9 w-28 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                      </div>
                      <Button type="submit" size="sm">Add</Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GRNs */}
            {po.goodsReceipts.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Goods Receipts</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <Thead><Tr><Th>GRN Number</Th><Th>Date</Th><Th>Status</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {po.goodsReceipts.map((grn) => (
                        <Tr key={grn.id}>
                          <Td className="font-mono text-xs">{grn.grnNumber}</Td>
                          <Td>{formatDate(grn.receiptDate)}</Td>
                          <Td><Badge variant={statusVariant(grn.status)}>{STATUS_LABELS[grn.status]}</Badge></Td>
                          <Td><Link href={`/receipts/${grn.id}`}><Button variant="ghost" size="sm">View</Button></Link></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {isDraft && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Actions</p>
                  <form action={updatePurchaseOrderStatus}>
                    <input type="hidden" name="id" value={po.id} />
                    <input type="hidden" name="status" value="confirmed" />
                    <Button type="submit" className="w-full">Confirm PO</Button>
                  </form>
                  {po.status === "confirmed" && (
                    <Link href={`/receipts?poId=${po.id}`} className="block">
                      <Button variant="outline" className="w-full">Create GRN</Button>
                    </Link>
                  )}
                  <form action={updatePurchaseOrderStatus}>
                    <input type="hidden" name="id" value={po.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <Button type="submit" variant="destructive" className="w-full">Cancel PO</Button>
                  </form>
                  <form action={deletePurchaseOrder}>
                    <input type="hidden" name="id" value={po.id} />
                    <Button type="submit" variant="ghost" size="sm" className="w-full text-slate-500">Delete Draft</Button>
                  </form>
                </CardContent>
              </Card>
            )}
            {po.status === "confirmed" && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-semibold">Actions</p>
                  <Link href={`/receipts/new?poId=${po.id}`} className="block">
                    <Button className="w-full">Create Goods Receipt</Button>
                  </Link>
                  <form action={updatePurchaseOrderStatus}>
                    <input type="hidden" name="id" value={po.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <Button type="submit" variant="destructive" className="w-full">Cancel PO</Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
