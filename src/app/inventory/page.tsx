import { ModulePage } from "@/components/layout/module-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createProductCategory, createProductVariant, deleteProductCategory, deleteProductVariant, updateProductCategory, updateProductVariant } from "@/app/inventory/actions";
import { getInventoryOverview, hasInventoryDatabase, getProductCategories } from "@/server/services/inventory-service";
import { getPermissions, getSessionUser } from "@/lib/auth";
import { Pagination } from "@/components/layout/pagination";
import { paginate, parsePage } from "@/lib/pagination";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function InventoryPage({
  searchParams
}: {
  searchParams?: { q?: string; page?: string };
}) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const search = String(searchParams?.q ?? "");
  const page = parsePage(searchParams?.page);
  const [overview, categories] = await Promise.all([
    getInventoryOverview({ search }),
    getProductCategories()
  ]);
  const productPage = paginate(overview.variants, page, 6);

  return (
    <ModulePage
      title="Inventory"
      description="Manage product categories, models, colors, sizes, and stock ledger movements."
      sections={[
        { label: "Overview", href: "#overview" },
        { label: "Manage", href: "#manage" },
        { label: "Products", href: "#products" }
      ]}
      stats={[
        { label: "Categories", value: overview.categoryCount, help: "Master data groups" },
        { label: "Variants", value: overview.variantCount, help: "Category/model/color/size combinations" },
        { label: "Opening Stock", value: overview.openingStock.toLocaleString("en-US"), help: "Starting balance" },
        { label: "Reorder Alerts", value: overview.reorderAlerts, help: "At or below reorder level" }
      ]}
      items={[
        { title: "Variant master", detail: "Maintain one record per sellable product variation.", tag: "Master data" },
        { title: "Stock ledger", detail: "Track production, sales, returns, and adjustments.", tag: "Ledger" },
        { title: "Stock valuation", detail: "Calculate inventory value using production cost per unit.", tag: "Value" }
      ]}
    >
      <Card id="overview">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <form className="flex flex-1 flex-col gap-3 md:flex-row" action="/inventory" method="get">
            <div className="space-y-2 md:flex-1">
              <Label htmlFor="q">Search categories or variants</Label>
              <Input id="q" name="q" defaultValue={search} placeholder="Model, SKU, color, size" />
            </div>
            <Button type="submit">Search</Button>
            {search ? (
              <Link href="/inventory" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                Reset
              </Link>
            ) : null}
          </form>
          <div className="text-sm text-slate-500">{overview.variantCount} variants</div>
        </CardContent>
      </Card>

      {!hasInventoryDatabase() ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-slate-900">DATABASE_URL not configured</p>
            <p className="mt-1 text-sm text-slate-600">Add a PostgreSQL connection string to enable real inventory CRUD and stock ledger data.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2" id="manage">
        {permissions.canManageInventory ? (
          <>
            <FormSection title="Create product category">
              <form action={createProductCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category name</Label>
                  <Input id="category-name" name="name" placeholder="Belt" required />
                </div>
                <Button type="submit">Save category</Button>
              </form>
            </FormSection>

            <FormSection title="Create product variant">
              <form action={createProductVariant} className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select id="categoryId" name="categoryId" required>
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" placeholder="LX-01" required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" name="color" placeholder="Black" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input id="size" name="size" placeholder="M" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" name="sku" placeholder="BELT-LX-01-BLK-M" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openingStock">Opening stock</Label>
                    <Input id="openingStock" name="openingStock" type="number" min="0" step="1" defaultValue={0} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder level</Label>
                    <Input id="reorderLevel" name="reorderLevel" type="number" min="0" step="1" defaultValue={0} required />
                  </div>
                </div>
                <Button type="submit">Save variant</Button>
              </form>
            </FormSection>
          </>
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">You have read-only access to inventory records.</CardContent>
          </Card>
        )}
      </div>

      <Card id="products">
        <CardHeader>
          <CardTitle>Categories and variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overview.categories.length === 0 ? (
            <p className="text-sm text-slate-600">No inventory categories configured yet.</p>
          ) : (
            overview.categories.map((category) => (
              <div key={category.id} className="rounded-xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-xs text-slate-500">ID: {category.id}</p>
                  </div>
                    <div className="flex items-center gap-2">
                      <Badge>{category.variants.length} variants</Badge>
                      <Link href={`/inventory/${category.id}`} className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                        Details
                      </Link>
                      {permissions.canManageInventory ? (
                        <form action={deleteProductCategory}>
                          <input type="hidden" name="id" value={category.id} />
                          <Button type="submit" variant="secondary">Delete</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                {permissions.canManageInventory ? (
                  <form action={updateProductCategory} className="mt-4 flex gap-2">
                    <input type="hidden" name="id" value={category.id} />
                    <Input name="name" defaultValue={category.name} className="max-w-sm" />
                    <Button type="submit">Update category</Button>
                  </form>
                ) : null}
                <div className="mt-4 grid gap-3">
                  {category.variants.map((variant) => (
                    <div key={variant.id} className="rounded-lg bg-white p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="grid gap-1">
                          <p className="font-medium">{variant.model}</p>
                          <p className="text-slate-600">
                            {variant.color ?? "No color"} · {variant.size ?? "No size"} · Reorder {variant.reorderLevel}
                          </p>
                          {variant.sku ? <p className="text-slate-500">SKU {variant.sku}</p> : null}
                          <p className="text-slate-500">Stock {variant.openingStock}</p>
                        </div>
                        {permissions.canManageInventory ? (
                          <form action={deleteProductVariant}>
                            <input type="hidden" name="id" value={variant.id} />
                            <Button type="submit" variant="secondary">Delete</Button>
                          </form>
                        ) : null}
                      </div>
                      {permissions.canManageInventory ? (
                        <form action={updateProductVariant} className="mt-4 grid gap-2 md:grid-cols-6">
                          <input type="hidden" name="id" value={variant.id} />
                          <div className="md:col-span-1">
                            <Label htmlFor={`categoryId-${variant.id}`} className="sr-only">Category</Label>
                            <Select name="categoryId" defaultValue={category.id} id={`categoryId-${variant.id}`}>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </Select>
                          </div>
                          <Input name="model" defaultValue={variant.model} />
                          <Input name="color" defaultValue={variant.color ?? ""} placeholder="Color" />
                          <Input name="size" defaultValue={variant.size ?? ""} placeholder="Size" />
                          <Input name="sku" defaultValue={variant.sku ?? ""} placeholder="SKU" />
                          <Input name="openingStock" type="number" min="0" step="1" defaultValue={variant.openingStock} />
                          <Input name="reorderLevel" type="number" min="0" step="1" defaultValue={variant.reorderLevel} />
                          <Button type="submit" className="md:col-span-6">Update variant</Button>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {productPage.items.length === 0 ? (
            <p className="text-sm text-slate-600">No products found.</p>
          ) : (
            productPage.items.map((variant) => (
              <div key={variant.id} className="rounded-xl border bg-slate-50 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{variant.category.name} · {variant.model}</p>
                    <p className="text-slate-600">{variant.color ?? "No color"} · {variant.size ?? "No size"}</p>
                    <p className="text-xs text-slate-500">{variant.sku ?? "No SKU"}</p>
                  </div>
                  <Badge>Stock {variant.openingStock}</Badge>
                </div>
              </div>
            ))
          )}
          <Pagination
            basePath="/inventory"
            page={productPage.page}
            totalPages={productPage.totalPages}
            params={{ q: search || undefined }}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}
