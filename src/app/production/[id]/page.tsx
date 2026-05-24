import { ModulePage } from "@/components/layout/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPermissions, getSessionUser } from "@/lib/auth";
import { uploadAttachment } from "@/app/attachments/actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { calculateProductionTotal } from "@/lib/calculations";

export default async function ProductionDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const batch = await prisma.productionBatch.findUnique({
    where: { id: params.id },
    include: { productVariant: { include: { category: true } } }
  });

  if (!batch) notFound();
  const attachments = await prisma.attachment.findMany({
    where: { entityType: "productionBatch", entityId: batch.id },
    orderBy: { createdAt: "desc" }
  });

  const total = calculateProductionTotal({
    materialCost: Number(batch.materialCost),
    laborCost: Number(batch.laborCost),
    packagingCost: Number(batch.packagingCost),
    otherCost: Number(batch.otherCost)
  });

  return (
    <ModulePage title={`${batch.productVariant.category.name} · ${batch.productVariant.model}`} description="Production batch detail view.">
      <Card>
        <CardHeader>
          <CardTitle>Batch summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>Batch date: {batch.batchDate.toLocaleDateString()}</p>
          <p>Quantity: {batch.quantity}</p>
          <p>Total cost: {total.toLocaleString("en-US")}</p>
          {batch.note ? <p>Note: {batch.note}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {attachments.length === 0 ? <p className="text-sm text-slate-600">No attachments yet.</p> : attachments.map((attachment) => (
            <a key={attachment.id} href={attachment.fileUrl} className="rounded-xl border bg-slate-50 p-4 text-sm hover:bg-slate-100" target="_blank" rel="noreferrer">
              {attachment.originalName}
            </a>
          ))}
          {permissions.canManageOperations ? (
            <form action={uploadAttachment} encType="multipart/form-data" className="grid gap-3 border-t pt-4">
              <input type="hidden" name="entityType" value="productionBatch" />
              <input type="hidden" name="entityId" value={batch.id} />
              <div className="space-y-2">
                <Label htmlFor="file">Upload receipt</Label>
                <Input id="file" name="file" type="file" />
              </div>
              <Button type="submit">Upload</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
