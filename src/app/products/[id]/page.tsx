import { requireSession, getPermissions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, statusVariant } from "@/components/ui/badge";
import { getProductDetail, getCategories, getUoms, getProductsWithStock } from "@/server/services/product-service";
import { getWarehouseDropdownList } from "@/server/services/warehouse-service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { computeCurrentStock } from "@/lib/calculations";
import { updateProduct, postOpeningStock } from "../actions";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageProducts) redirect("/403");

  const { id } = await params;
  const [product, categories, uoms, warehouses] = await Promise.all([
    getProductDetail(id),
    getCategories(),
    getUoms(),
    getWarehouseDropdownList(),
  ]);

  if (!product) notFound();

  const currentStock = computeCurrentStock(
    product.stockLedger.map((l) => ({ movementType: l.movementType, quantity: l.quantity }))
  );
  const hasOpening = product.stockLedger.some((l) => l.movementType === "opening");

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4">
          <Link href="/products" className="text-sm text-slate-500 hover:text-slate-700">← Products</Link>
        </div>
        <PageHeader title={product.name} description={`SKU: ${product.sku}`} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">Category:</span> <span className="font-medium ml-1">{product.category.name}</span></div>
                  <div><span className="text-slate-500">UoM:</span> <span className="font-medium ml-1">{product.uom.name} ({product.uom.abbreviation})</span></div>
                  <div><span className="text-slate-500">Cost Price:</span> <span className="font-medium ml-1">{formatCurrency(product.costPrice)}</span></div>
                  <div><span className="text-slate-500">Sale Price:</span> <span className="font-medium ml-1">{formatCurrency(product.salePrice)}</span></div>
                  <div><span className="text-slate-500">Reorder Level:</span> <span className="font-medium ml-1">{product.reorderLevel} {product.uom.abbreviation}</span></div>
                  <div>
                    <span className="text-slate-500">Current Stock:</span>
                    <span className={`font-bold ml-1 ${currentStock <= 0 ? "text-red-600" : currentStock <= product.reorderLevel ? "text-amber-600" : "text-green-700"}`}>
                      {formatNumber(currentStock)} {product.uom.abbreviation}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Stock Ledger (Last 30)</CardTitle></CardHeader>
              <CardContent>
                {product.stockLedger.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No stock movements yet</p>
                ) : (
                  <Table>
                    <Thead>
                      <Tr><Th>Date</Th><Th>Type</Th><Th>Qty</Th><Th>Unit Cost</Th><Th>Warehouse</Th><Th>Notes</Th></Tr>
                    </Thead>
                    <Tbody>
                      {product.stockLedger.map((l) => (
                        <Tr key={l.id}>
                          <Td>{formatDate(l.movedAt)}</Td>
                          <Td><Badge variant={statusVariant(l.movementType)}>{STATUS_LABELS[l.movementType] ?? l.movementType}</Badge></Td>
                          <Td className={["sale_out", "transfer_out"].includes(l.movementType) ? "text-red-600" : "text-green-700"}>
                            {["sale_out", "transfer_out"].includes(l.movementType) ? "-" : "+"}{formatNumber(l.quantity)}
                          </Td>
                          <Td>{formatCurrency(l.unitCost)}</Td>
                          <Td>{l.warehouse?.name ?? "—"}</Td>
                          <Td className="max-w-xs truncate">{l.notes ?? "—"}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {!hasOpening && (
              <Card>
                <CardHeader><CardTitle>Set Opening Stock</CardTitle></CardHeader>
                <CardContent>
                  <form action={postOpeningStock} className="space-y-3">
                    <input type="hidden" name="productVariantId" value={product.id} />
                    <div>
                      <label className="text-xs font-medium text-slate-600">Quantity *</label>
                      <input name="quantity" type="number" min="1" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Unit Cost</label>
                      <input name="unitCost" type="number" step="0.01" min="0" defaultValue="0" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Warehouse</label>
                      <select name="warehouseId" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                        <option value="">No warehouse</option>
                        {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.isDefault ? " (Default)" : ""}</option>)}
                      </select>
                    </div>
                    <Button type="submit" className="w-full">Post Opening Stock</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Edit Product</CardTitle></CardHeader>
              <CardContent>
                <form action={updateProduct} className="space-y-3">
                  <input type="hidden" name="id" value={product.id} />
                  <div>
                    <label className="text-xs font-medium text-slate-600">SKU</label>
                    <input name="sku" defaultValue={product.sku} required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Name</label>
                    <input name="name" defaultValue={product.name} required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Category</label>
                    <select name="categoryId" defaultValue={product.categoryId} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Unit of Measure</label>
                    <select name="uomId" defaultValue={product.uomId} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                      {uoms.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Cost Price</label>
                      <input name="costPrice" type="number" step="0.01" min="0" defaultValue={String(product.costPrice)} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Sale Price</label>
                      <input name="salePrice" type="number" step="0.01" min="0" defaultValue={String(product.salePrice)} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Reorder Level</label>
                    <input name="reorderLevel" type="number" min="0" defaultValue={product.reorderLevel} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
