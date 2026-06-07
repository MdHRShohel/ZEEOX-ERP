"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { returnSchema, returnItemSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";
import { computeReturnTotal } from "@/lib/calculations";

async function requireStaff() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageReturns) throw new Error("Forbidden");
  return session;
}

export async function createReturn(formData: FormData) {
  const session = await requireStaff();
  const parsed = returnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const ret = await prisma.return.create({
    data: {
      ...parsed.data,
      salesInvoiceId: parsed.data.salesInvoiceId || undefined,
      totalAmount: 0,
      isPosted: false,
    },
  });
  await logAudit({ entityType: "Return", entityId: ret.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/returns");
  redirect(`/returns/${ret.id}`);
}

export async function addReturnItem(formData: FormData) {
  const session = await requireStaff();
  const parsed = returnItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const ret = await prisma.return.findUnique({ where: { id: parsed.data.returnId } });
  if (!ret || ret.isPosted) return { error: "Cannot edit a posted return" };
  await prisma.returnItem.create({ data: parsed.data });
  const items = await prisma.returnItem.findMany({ where: { returnId: ret.id } });
  const total = computeReturnTotal(items.map((i) => ({ quantity: i.quantity, unitPrice: Number(i.unitPrice) })));
  await prisma.return.update({ where: { id: ret.id }, data: { totalAmount: total } });
  revalidatePath(`/returns/${ret.id}`);
  return { success: true };
}

export async function postReturn(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const ret = await prisma.return.findUnique({ where: { id }, include: { items: true } });
  if (!ret) return { error: "Not found" };
  if (ret.isPosted) return { error: "Already posted" };
  if (ret.items.length === 0) return { error: "Cannot post an empty return" };

  await prisma.$transaction(async (tx) => {
    for (const item of ret.items) {
      await tx.stockLedger.create({
        data: {
          productVariantId: item.productVariantId,
          movementType: "return_in",
          quantity: item.quantity,
          unitCost: item.unitPrice,
          referenceType: "return",
          referenceId: ret.id,
          notes: `Return: ${ret.returnNo}`,
          movedAt: ret.returnDate,
        },
      });
    }
    await tx.return.update({ where: { id }, data: { isPosted: true } });
  });

  await logAudit({ entityType: "Return", entityId: id, action: "post", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/returns/${id}`);
  revalidatePath("/returns");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true };
}
