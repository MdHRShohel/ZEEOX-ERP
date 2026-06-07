"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { customerSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";

async function requireStaff() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageCustomers) throw new Error("Forbidden");
  return session;
}

export async function createCustomer(formData: FormData) {
  const session = await requireStaff();
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const customer = await prisma.customer.create({ data: parsed.data });
  await logAudit({ entityType: "Customer", entityId: customer.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/customers");
  return { success: true };
}

export async function updateCustomer(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.customer.update({ where: { id }, data: parsed.data });
  await logAudit({ entityType: "Customer", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true };
}

export async function deleteCustomer(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const count = await prisma.salesInvoice.count({ where: { customerId: id } });
  if (count > 0) return { error: `Cannot delete: ${count} invoice(s) linked to this customer.` };
  await prisma.customer.delete({ where: { id } });
  await logAudit({ entityType: "Customer", entityId: id, action: "delete", actorId: session.id, actorName: session.displayName });
  revalidatePath("/customers");
  return { success: true };
}
