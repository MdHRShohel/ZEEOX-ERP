import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { getGoodsReceiptDetail } from "@/server/services/grn-service";
import { getProductDropdownList } from "@/server/services/product-service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { addGoodsReceiptItem, removeGoodsReceiptItem, postGoodsReceipt, deleteGoodsReceipt } from "../actions";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

export default async function GoodsReceiptDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canReceiveGoods) redirect("/403");

  const { id } = await params;
  const [grn, products] = await Promise.all([
    getGoodsReceiptDetail(id),
    getProductDropdownList(),
  ]);
  if (!grn) notFound();

  const isDraft = grn.status === "draft";
  const poItemMap = new Map(grn.purchaseOrder.items.map((i) => [i.productVariantId, i]));

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4"><Link href="/receipts" className="text-sm text-slate-500 hover:text-slate-700">← Goods Receipts</Link></div>
        <PageHeader
          title={`GRN: ${grn.grnNumber}`}
          description={`PO: ${grn.purchaseOrder.poNumber} — ${grn.purchaseOrder.supplier.name}`}
          action={<Badge variant={statusVariant(grn.status)} className="text-sm px-3 py-1">{STATUS_LABELS[grn.status]}</Badge>}
        />

        {grn.status === "posted" && (
          <Alert variant="success" className="mb-4">
            This GRN has been posted. Stock ledger has been updated.
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Receipt Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">PO Number:</span> <Link href={`/purchases/${grn.purchaseOrderId}`} className="font-medium ml-1 underline">{grn.purchaseOrder.poNumber}</Link></div>
                  <div><span className="text-slate-500">Supplier:</span> <span className="font-medium ml-1">{grn.purchaseOrder.supplier.name}</span></div>
                  <div><span className="text-slate-500">Warehouse:</span> <span className="font-medium ml-1">{grn.warehouse.name}</span></div>
                  <div><span className="text-slate-500">Receipt Date:</span> <span className="font-medium ml-1">{formatDate(grn.receiptDate)}</span></div>
                  {grn.notes && <div className="col-span-2"><span className="text-slate-500">Notes:</span> <span className="ml-1">{grn.notes}</span></div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receipt Items</CardTitle>
              </CardHeader>
              <CardContent>
                {grn.items.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No items yet. Add items below based on the PO lines.</p>
                ) : (
                  <Table>
                    <Thead>
                      <Tr><Th>Product</Th><Th>SKU</Th><Th>Received Qty</Th><Th>PO Ordered</Th><Th>Unit Cost</Th><Th>Line Total</Th>{isDraft && <Th></Th>}</Tr>
                    </Thead>
                    <Tbody>
                      {grn.items.map((item) => {
                        const poItem = poItemMap.get(item.productVariantId);
                        return (
                          <Tr key={item.id}>
                            <Td>{item.productVariant.name}</Td>
                            <Td className="font-mono text-xs">{item.productVariant.sku}</Td>
                            <Td className="text-green-700 font-semibold">{formatNumber(item.receivedQty)} {item.productVariant.uom.abbreviation}</Td>
                            <Td className="text-slate-400">{poItem ? `${poItem.orderedQty} ordered` : "—"}</Td>
                            <Td>{formatCurrency(item.unitCost)}</Td>
                            <Td>{formatCurrency(item.receivedQty * Number(item.unitCost))}</Td>
                            {isDraft && (
                              <Td>
                                <form action={removeGoodsReceiptItem} className="inline">
                                  <input type="hidden" name="itemId" value={item.id} />
                                  <Button type="submit" variant="ghost" size="sm" className="text-red-600">Remove</Button>
                                </form>
                              </Td>
                            )}
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                )}

                {isDraft && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-2">Add Item</p>
                    <form action={addGoodsReceiptItem} className="flex gap-2 flex-wrap items-end">
                      <input type="hidden" name="goodsReceiptId" value={grn.id} />
                      <div className="flex-1 min-w-40">
                        <label className="text-xs text-slate-500">Product</label>
                        <select name="productVariantId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                          <option value="">Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Received Qty</label>
                        <input name="receivedQty" type="number" min="1" required placeholder="0" className="mt-1 flex h-9 w-24 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
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
          </div>

          <div className="space-y-4">
            {isDraft && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Actions</p>
                  <p className="text-xs text-slate-500">Posting this GRN will update stock levels and mark PO items as received. This cannot be undone.</p>
                  <form action={postGoodsReceipt}>
                    <input type="hidden" name="id" value={grn.id} />
                    <Button type="submit" className="w-full" disabled={grn.items.length === 0}>
                      Post GRN (Update Stock)
                    </Button>
                  </form>
                  <form action={deleteGoodsReceipt}>
                    <input type="hidden" name="id" value={grn.id} />
                    <Button type="submit" variant="ghost" size="sm" className="w-full text-red-600">Delete Draft GRN</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>PO Reference Lines</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {grn.purchaseOrder.items.map((poItem) => (
                    <div key={poItem.id} className="flex justify-between text-sm">
                      <span className="text-slate-600 truncate flex-1">{poItem.productVariant.name}</span>
                      <span className="ml-2 text-slate-400 whitespace-nowrap">{poItem.orderedQty} ordered / {poItem.receivedQty} rcvd</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
