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
import { getTransferDetail } from "@/server/services/transfer-service";
import { getProductDropdownList } from "@/server/services/product-service";
import { formatDate, formatNumber } from "@/lib/utils";
import { addTransferItem, postStockTransfer } from "../actions";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

export default async function TransferDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canTransferStock) redirect("/403");

  const { id } = await params;
  const [transfer, products] = await Promise.all([
    getTransferDetail(id),
    getProductDropdownList(),
  ]);
  if (!transfer) notFound();

  const isDraft = transfer.status === "draft";

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4"><Link href="/transfers" className="text-sm text-slate-500 hover:text-slate-700">← Stock Transfers</Link></div>
        <PageHeader
          title={`Transfer: ${transfer.transferNo}`}
          description={`${transfer.fromWarehouse.name} → ${transfer.toWarehouse.name}`}
          action={<Badge variant={statusVariant(transfer.status)} className="text-sm px-3 py-1">{STATUS_LABELS[transfer.status]}</Badge>}
        />

        {transfer.status === "posted" && (
          <Alert variant="success" className="mb-4">Transfer posted. Stock ledger has been updated for both warehouses.</Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Transfer Items</CardTitle></CardHeader>
              <CardContent>
                {transfer.items.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No items yet. Add products below.</p>
                ) : (
                  <Table>
                    <Thead><Tr><Th>Product</Th><Th>SKU</Th><Th>Quantity</Th></Tr></Thead>
                    <Tbody>
                      {transfer.items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.productVariant.name}</Td>
                          <Td className="font-mono text-xs">{item.productVariant.sku}</Td>
                          <Td>{formatNumber(item.quantity)} {item.productVariant.uom.abbreviation}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}

                {isDraft && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-2">Add Item</p>
                    <form action={addTransferItem} className="flex gap-2 flex-wrap items-end">
                      <input type="hidden" name="stockTransferId" value={transfer.id} />
                      <div className="flex-1 min-w-40">
                        <label className="text-xs text-slate-500">Product</label>
                        <select name="productVariantId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                          <option value="">Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Quantity</label>
                        <input name="quantity" type="number" min="1" required placeholder="0" className="mt-1 flex h-9 w-24 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                      </div>
                      <Button type="submit" size="sm">Add</Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-semibold">Transfer Details</p>
                <div className="text-sm space-y-1">
                  <div><span className="text-slate-500">From:</span> <span className="font-medium ml-1">{transfer.fromWarehouse.name}</span></div>
                  <div><span className="text-slate-500">To:</span> <span className="font-medium ml-1">{transfer.toWarehouse.name}</span></div>
                  <div><span className="text-slate-500">Date:</span> <span className="font-medium ml-1">{formatDate(transfer.transferDate)}</span></div>
                  {transfer.notes && <div><span className="text-slate-500">Notes:</span> <span className="ml-1">{transfer.notes}</span></div>}
                </div>
                {isDraft && (
                  <>
                    <hr className="border-slate-100" />
                    <p className="text-xs text-slate-500">Posting creates paired transfer_out/transfer_in ledger entries for all items.</p>
                    <form action={postStockTransfer}>
                      <input type="hidden" name="id" value={transfer.id} />
                      <Button type="submit" className="w-full" disabled={transfer.items.length === 0}>
                        Post Transfer
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
