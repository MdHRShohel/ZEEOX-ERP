"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { companySchema, investorSchema } from "@/lib/domain-schemas";
import { hasDatabase } from "@/server/services/company-service";
import { logAuditEvent } from "@/server/services/audit-service";
import { canManageScope, getSessionUser } from "@/lib/auth";

function requireDatabase() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is required to create or update company records.");
  }
}

async function requireCompanyAccess() {
  const user = await getSessionUser();
  if (!user || !canManageScope(user.role, "company")) {
    throw new Error("You do not have permission to manage company records.");
  }
}

export async function createCompany(formData: FormData) {
  await requireCompanyAccess();
  requireDatabase();

  const parsed = companySchema.safeParse({
    name: formData.get("name")
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid company data");
  }

  const company = await prisma.company.create({ data: parsed.data });
  await logAuditEvent({ entity: "company", action: "create", payload: company });
  revalidatePath("/company");
}

export async function createInvestor(formData: FormData) {
  await requireCompanyAccess();
  requireDatabase();

  const parsed = investorSchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    investmentAmount: Number(formData.get("investmentAmount")),
    ownershipPercent: Number(formData.get("ownershipPercent")),
    profitSharePercent: Number(formData.get("profitSharePercent"))
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid investor data");
  }

  const notes = formData.get("notes");

  const investor = await prisma.investor.create({
    data: {
      ...parsed.data,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null
    }
  });

  await logAuditEvent({ entity: "investor", action: "create", payload: investor });
  revalidatePath("/company");
}

export async function updateCompany(formData: FormData) {
  await requireCompanyAccess();
  requireDatabase();

  const id = formData.get("id");
  const parsed = companySchema.safeParse({
    name: formData.get("name")
  });

  if (typeof id !== "string" || !id.trim()) throw new Error("Company ID is required");
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid company data");

  const company = await prisma.company.update({
    where: { id: id.trim() },
    data: parsed.data
  });

  await logAuditEvent({ entity: "company", action: "update", payload: company });
  revalidatePath("/company");
}

export async function deleteCompany(formData: FormData) {
  await requireCompanyAccess();
  requireDatabase();

  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Company ID is required");

  const company = await prisma.company.delete({
    where: { id: id.trim() }
  });

  await logAuditEvent({ entity: "company", action: "delete", payload: company });
  revalidatePath("/company");
}

export async function updateInvestor(formData: FormData) {
  await requireCompanyAccess();
  requireDatabase();

  const id = formData.get("id");
  const companyId = formData.get("companyId");
  const notes = formData.get("notes");
  const parsed = investorSchema.safeParse({
    companyId,
    name: formData.get("name"),
    investmentAmount: Number(formData.get("investmentAmount")),
    ownershipPercent: Number(formData.get("ownershipPercent")),
    profitSharePercent: Number(formData.get("profitSharePercent"))
  });

  if (typeof id !== "string" || !id.trim()) throw new Error("Investor ID is required");
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid investor data");

  const investor = await prisma.investor.update({
    where: { id: id.trim() },
    data: {
      ...parsed.data,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null
    }
  });

  await logAuditEvent({ entity: "investor", action: "update", payload: investor });
  revalidatePath("/company");
}

export async function deleteInvestor(formData: FormData) {
  await requireCompanyAccess();
  requireDatabase();

  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Investor ID is required");

  const investor = await prisma.investor.delete({
    where: { id: id.trim() }
  });

  await logAuditEvent({ entity: "investor", action: "delete", payload: investor });
  revalidatePath("/company");
}
