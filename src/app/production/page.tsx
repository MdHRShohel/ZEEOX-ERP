import { createProductionBatch, deleteProductionBatch, updateProductionBatch } from "@/app/production/actions";
import { ModulePage } from "@/components/layout/module-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getProductionOverview, hasOperationsDatabase } from "@/server/services/operations-service";
import { getProductVariants } from "@/server/services/inventory-service";
import { getPermissions, getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { calculateProductionTotal } from "@/lib/calculations";
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

export default async function ProductionPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const search = String(searchParams?.q ?? "");
  const [overview, variants] = await Promise.all([
    getProductionOverview({ search }),
    getProductVariants()
  ]);

  return (
    <ModulePage
      title="Production"
      description="Capture batch costs, quantities, and unit production cost, then push stock into inventory."
      stats={[
        { label: "Batches", value: overview.batchCount, help: "Production records" },
        { label: "Total Output", value: overview.quantityTotal, help: "Units produced" },
        { label: "Total Cost", value: overview.costTotal.toLocaleString("en-US"), help: "Material + labor + packaging + other" },
        { label: "Unit Cost", value: overview.batchCount ? Math.round(overview.costTotal / overview.quantityTotal || 0).toLocaleString("en-US") : "0", help: "Average batch cost" }
      ]}
      items={[
        { title: "Batch entry", detail: "Material, labor, packaging, and other cost breakdown." },
        { title: "Cost calculation", detail: "Auto-calculate total and unit cost per batch." },
        { title: "Inventory sync", detail: "Increase stock automatically when batch is posted." }
      ]}
    >
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <form className="flex flex-1 flex-col gap-3 md:flex-row" action="/production" method="get">
            <div className="space-y-2 md:flex-1">
              <Label htmlFor="q">Search production</Label>
              <Input id="q" name="q" defaultValue={search} placeholder="Model, SKU, note, category" />
            </div>
            <Button type="submit">Search</Button>
            {search ? (
              <Link href="/production" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                Reset
              </Link>
            ) : null}
          </form>
          <div className="text-sm text-slate-500">{overview.batchCount} batches</div>
        </CardContent>
      </Card>

      {!hasOperationsDatabase() ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-slate-900">DATABASE_URL not configured</p>
            <p className="mt-1 text-sm text-slate-600">Add a PostgreSQL connection string to enable production CRUD and stock posting.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {permissions.canManageOperations ? (
          <FormSection title="Create production batch">
            <form action={createProductionBatch} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="productVariantId">Product variant</Label>
                <Select id="productVariantId" name="productVariantId" required>
                  <option value="">Select variant</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.category.name} · {v.model} ({v.color || "No color"} / {v.size || "No size"})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batchDate">Batch date</Label>
                  <Input id="batchDate" name="batchDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" step="1" required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="materialCost">Material cost</Label>
                  <Input id="materialCost" name="materialCost" type="number" min="0" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Labor cost</Label>
                  <Input id="laborCost" name="laborCost" type="number" min="0" step="0.01" required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="packagingCost">Packaging cost</Label>
                  <Input id="packagingCost" name="packagingCost" type="number" min="0" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCost">Other cost</Label>
                  <Input id="otherCost" name="otherCost" type="number" min="0" step="0.01" required />
                </div>
              </div>
              <Button type="submit">Save batch</Button>
            </form>
          </FormSection>
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">You have read-only access to production records.</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Production batches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.batches.length === 0 ? (
              <p className="text-sm text-slate-600">No production batches configured yet.</p>
            ) : (
                overview.batches.slice(0, 6).map((batch) => {
                  const total = calculateProductionTotal({
                    materialCost: Number(batch.materialCost),
                    laborCost: Number(batch.laborCost),
                    packagingCost: Number(batch.packagingCost),
                    otherCost: Number(batch.otherCost)
                  });
                  return (
                    <div key={batch.id} className="rounded-xl border bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{batch.productVariant.category.name} · {batch.productVariant.model}</p>
                          <p className="text-sm text-slate-600">{batch.quantity} units on {batch.batchDate.toLocaleDateString()}</p>
                        </div>
                        <Badge>{total.toLocaleString("en-US")}</Badge>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Link href={`/production/${batch.id}`} className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                          Details
                        </Link>
                      </div>
                      {permissions.canManageOperations ? (
                      <form action={updateProductionBatch} className="mt-4 grid gap-3 border-t pt-4">
                        <input type="hidden" name="id" value={batch.id} />
                        <div className="space-y-2">
                          <Label htmlFor={`productVariantId-${batch.id}`}>Product variant</Label>
                          <Select id={`productVariantId-${batch.id}`} name="productVariantId" defaultValue={batch.productVariantId} required>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.category.name} · {v.model} ({v.color || "No color"} / {v.size || "No size"})
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`batchDate-${batch.id}`}>Batch date</Label>
                            <Input id={`batchDate-${batch.id}`} name="batchDate" type="date" defaultValue={batch.batchDate.toISOString().slice(0, 10)} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`quantity-${batch.id}`}>Quantity</Label>
                            <Input id={`quantity-${batch.id}`} name="quantity" type="number" min="1" step="1" defaultValue={batch.quantity} required />
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`materialCost-${batch.id}`}>Material cost</Label>
                            <Input id={`materialCost-${batch.id}`} name="materialCost" type="number" min="0" step="0.01" defaultValue={batch.materialCost.toString()} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`laborCost-${batch.id}`}>Labor cost</Label>
                            <Input id={`laborCost-${batch.id}`} name="laborCost" type="number" min="0" step="0.01" defaultValue={batch.laborCost.toString()} required />
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`packagingCost-${batch.id}`}>Packaging cost</Label>
                            <Input id={`packagingCost-${batch.id}`} name="packagingCost" type="number" min="0" step="0.01" defaultValue={batch.packagingCost.toString()} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`otherCost-${batch.id}`}>Other cost</Label>
                            <Input id={`otherCost-${batch.id}`} name="otherCost" type="number" min="0" step="0.01" defaultValue={batch.otherCost.toString()} required />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm">Update</Button>
                          <Button type="submit" formAction={deleteProductionBatch} variant="destructive" size="sm">Delete</Button>
                        </div>
                      </form>
                      ) : null}
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  );
}
