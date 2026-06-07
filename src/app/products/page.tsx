import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleStats } from "@/components/layout/module-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getProductsWithStock, getProductStats, getCategories, getUoms } from "@/server/services/product-service";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { createProduct } from "./actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; categoryId?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageProducts) redirect("/403");

  const { q, categoryId } = await searchParams;
  const [products, stats, categories, uoms] = await Promise.all([
    getProductsWithStock({ search: q, categoryId }),
    getProductStats(),
    getCategories(),
    getUoms(),
  ]);

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader
          title="Products"
          description="Manage your product catalog"
          action={
            <Link href="/products/categories">
              <Button variant="outline" size="sm">Manage Categories</Button>
            </Link>
          }
        />

        <ModuleStats stats={[
          { label: "Total Products", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Low Stock", value: stats.lowStock },
          { label: "Out of Stock", value: stats.outOfStock },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4 flex gap-3">
              <form className="flex gap-2 flex-1">
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search SKU or name…"
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <select
                  name="categoryId"
                  defaultValue={categoryId}
                  className="flex h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Button type="submit" variant="outline" size="sm">Filter</Button>
                {(q || categoryId) && (
                  <Link href="/products"><Button variant="ghost" size="sm">Reset</Button></Link>
                )}
              </form>
            </div>

            <Card>
              <CardContent className="pt-0">
                {products.length === 0 ? (
                  <EmptyState title="No products found" description="Add a product using the form on the right" />
                ) : (
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>SKU</Th>
                        <Th>Name</Th>
                        <Th>Category</Th>
                        <Th>Stock</Th>
                        <Th>Cost</Th>
                        <Th>Sale Price</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {products.map((p) => (
                        <Tr key={p.id}>
                          <Td className="font-mono text-xs">{p.sku}</Td>
                          <Td className="font-medium">{p.name}</Td>
                          <Td>{p.category.name}</Td>
                          <Td>
                            <span className={
                              p.currentStock <= 0 ? "text-red-600 font-semibold" :
                              p.currentStock <= p.reorderLevel ? "text-amber-600 font-semibold" :
                              "text-green-700"
                            }>
                              {formatNumber(p.currentStock)} {p.uom.abbreviation}
                            </span>
                          </Td>
                          <Td>{formatCurrency(p.costPrice)}</Td>
                          <Td>{formatCurrency(p.salePrice)}</Td>
                          <Td>
                            <Link href={`/products/${p.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Add Product</p>
              <form action={createProduct} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">SKU *</label>
                  <input name="sku" required placeholder="e.g. PROD-001" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Name *</label>
                  <input name="name" required placeholder="Product name" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Category *</label>
                  <select name="categoryId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Unit of Measure *</label>
                  <select name="uomId" required className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select unit</option>
                    {uoms.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Cost Price</label>
                    <input name="costPrice" type="number" step="0.01" min="0" defaultValue="0" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Sale Price</label>
                    <input name="salePrice" type="number" step="0.01" min="0" defaultValue="0" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Reorder Level</label>
                  <input name="reorderLevel" type="number" min="0" defaultValue="0" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <Button type="submit" className="w-full">Add Product</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
