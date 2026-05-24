"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { officeExpenseSchema } from "@/lib/domain-schemas";
import { hasOperationsDatabase } from "@/server/services/operations-service";
import { logAuditEvent } from "@/server/services/audit-service";
import { canManageScope, getSessionUser } from "@/lib/auth";

function requireDatabase() {
  if (!hasOperationsDatabase()) {
    throw new Error("DATABASE_URL is required to create expense records.");
  }
}

async function requireOperationsAccess() {
  const user = await getSessionUser();
  if (!user || !canManageScope(user.role, "operations")) {
    throw new Error("You do not have permission to manage expense records.");
  }
}

export async function createOfficeExpense(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const parsed = officeExpenseSchema.safeParse({
    expenseDate: formData.get("expenseDate"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount: Number(formData.get("amount"))
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid expense record");
  }

  const expense = await prisma.officeExpense.create({ data: parsed.data });
  await logAuditEvent({ entity: "officeExpense", action: "create", payload: expense });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateOfficeExpense(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const id = formData.get("id");
  const parsed = officeExpenseSchema.safeParse({
    expenseDate: formData.get("expenseDate"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount: Number(formData.get("amount"))
  });

  if (typeof id !== "string" || !id.trim()) throw new Error("Expense ID is required");
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid expense record");

  const expense = await prisma.officeExpense.update({
    where: { id: id.trim() },
    data: parsed.data
  });

  await logAuditEvent({ entity: "officeExpense", action: "update", payload: expense });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteOfficeExpense(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Expense ID is required");

  const expense = await prisma.officeExpense.delete({
    where: { id: id.trim() }
  });

  await logAuditEvent({ entity: "officeExpense", action: "delete", payload: expense });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
