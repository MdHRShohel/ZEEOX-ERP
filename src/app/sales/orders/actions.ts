"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { salesOrderSchema, salesOrderItemSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";
import { computeOrderTotal } from "@/lib/calculations";

async function requireStaff() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSales) throw new Error("Forbidden");
  return session;
}

export async function createSalesOrder(formData: FormData) {
  const session = await requireStaff();
  const parsed = salesOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const order = await prisma.salesOrder.create({ data: { ...parsed.data, status: "draft", totalAmount: 0 } });
  await logAudit({ entityType: "SalesOrder", entityId: order.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/sales/orders");
  redirect(`/sales/orders/${order.id}`);
}

export async function addSalesOrderItem(formData: FormData) {
  const session = await requireStaff();
  const parsed = salesOrderItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const order = await prisma.salesOrder.findUnique({ where: { id: parsed.data.salesOrderId }, include: { items: true } });
  if (!order) return { error: "Order not found" };
  if (!["draft", "confirmed"].includes(order.status)) return { error: "Cannot edit items on this order" };

  await prisma.salesOrderItem.create({ data: parsed.data });
  const items = await prisma.salesOrderItem.findMany({ where: { salesOrderId: order.id } });
  const total = computeOrderTotal(items.map((i) => ({ orderedQty: i.orderedQty, unitPrice: Number(i.unitPrice) })));
  await prisma.salesOrder.update({ where: { id: order.id }, data: { totalAmount: total } });

  revalidatePath(`/sales/orders/${order.id}`);
  return { success: true };
}

export async function updateSalesOrderStatus(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const newStatus = String(formData.get("status")) as "confirmed" | "cancelled";
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) return { error: "Not found" };
  const validTransitions: Record<string, string[]> = { draft: ["confirmed", "cancelled"], confirmed: ["cancelled"] };
  if (!validTransitions[order.status]?.includes(newStatus)) return { error: `Cannot transition to ${newStatus}` };
  await prisma.salesOrder.update({ where: { id }, data: { status: newStatus } });
  await logAudit({ entityType: "SalesOrder", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/sales/orders/${id}`);
  revalidatePath("/sales/orders");
  return { success: true };
}

export async function deleteSalesOrder(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const order = await prisma.salesOrder.findUnique({ where: { id }, include: { _count: { select: { invoices: true } } } });
  if (!order) return { error: "Not found" };
  if (order.status !== "draft") return { error: "Only draft orders can be deleted" };
  if (order._count.invoices > 0) return { error: "Cannot delete: invoices linked" };
  await prisma.salesOrder.delete({ where: { id } });
  revalidatePath("/sales/orders");
  redirect("/sales/orders");
}
