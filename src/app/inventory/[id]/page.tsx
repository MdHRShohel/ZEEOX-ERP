import { ModulePage } from "@/components/layout/module-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
  const category = await prisma.productCategory.findUnique({
    where: { id: params.id },
    include: {
      variants: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!category) notFound();

  return (
    <ModulePage title={category.name} description="Category and variant detail view.">
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {category.variants.map((variant) => (
            <div key={variant.id} className="rounded-xl border bg-slate-50 p-4 text-sm">
              <p className="font-medium">{variant.model}</p>
              <p className="text-slate-600">{variant.color ?? "No color"} · {variant.size ?? "No size"}</p>
              <p className="text-slate-600">SKU {variant.sku ?? "—"}</p>
              <p className="text-slate-600">Opening stock {variant.openingStock} · Reorder {variant.reorderLevel}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
