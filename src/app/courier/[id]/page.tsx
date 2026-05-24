import { ModulePage } from "@/components/layout/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPermissions, getSessionUser } from "@/lib/auth";
import { uploadAttachment } from "@/app/attachments/actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { calculateCourierTotal } from "@/lib/calculations";

export default async function CourierDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const shipment = await prisma.courierShipment.findUnique({
    where: { id: params.id },
    include: { salesInvoice: { include: { customer: true } } }
  });

  if (!shipment) notFound();
  const attachments = await prisma.attachment.findMany({
    where: { entityType: "courierShipment", entityId: shipment.id },
    orderBy: { createdAt: "desc" }
  });

  const total = calculateCourierTotal({
    deliveryCharge: Number(shipment.deliveryCharge),
    codCharge: Number(shipment.codCharge),
    returnCharge: Number(shipment.returnCharge)
  });

  return (
    <ModulePage title={shipment.courierName} description="Courier shipment detail view.">
      <Card>
        <CardHeader>
          <CardTitle>Shipment summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>Status: {shipment.status}</p>
          <p>Tracking: {shipment.trackingId ?? "—"}</p>
          <p>Invoice: {shipment.salesInvoice?.invoiceNo ?? "No invoice"}</p>
          <p>Total courier cost: {total.toLocaleString("en-US")}</p>
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
              <input type="hidden" name="entityType" value="courierShipment" />
              <input type="hidden" name="entityId" value={shipment.id} />
              <div className="space-y-2">
                <Label htmlFor="file">Upload slip</Label>
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
