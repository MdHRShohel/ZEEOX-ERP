"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { salesInvoiceSchema } from "@/lib/domain-schemas";
import { calculateNetProfit, calculateSalesTotal, calculateTotalCost } from "@/lib/calculations";
import { hasOperationsDatabase } from "@/server/services/operations-service";
import { logAuditEvent } from "@/server/services/audit-service";
import { canManageScope, getSessionUser } from "@/lib/auth";

function requireDatabase() {
  if (!hasOperationsDatabase()) {
    throw new Error("DATABASE_URL is required to create sales records.");
  }
}

async function requireOperationsAccess() {
  const user = await getSessionUser();
  if (!user || !canManageScope(user.role, "operations")) {
    throw new Error("You do not have permission to manage sales records.");
  }
}

export async function createSalesInvoice(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const invoiceNo = formData.get("invoiceNo");
  const invoiceDate = formData.get("invoiceDate");
  const customerId = formData.get("customerId");
  const paymentStatus = formData.get("paymentStatus");
  const productVariantId = formData.get("productVariantId");
  const customerName = formData.get("customerName");
  const customerMobile = formData.get("customerMobile");

  const parsed = salesInvoiceSchema.safeParse({
    invoiceNo,
    invoiceDate,
    customerId: typeof customerId === "string" && customerId.trim() ? customerId.trim() : undefined,
    paymentStatus
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid sales invoice");
  }

  const quantity = Number(formData.get("quantity"));
  const sellingPrice = Number(formData.get("sellingPrice"));
  const productionCostUnit = Number(formData.get("productionCostUnit"));
  const courierCost = Number(formData.get("courierCost"));
  const adsCost = Number(formData.get("adsCost"));
  const packagingCost = Number(formData.get("packagingCost"));

  if (typeof productVariantId !== "string" || !productVariantId.trim()) {
    throw new Error("Product variant is required");
  }

  const totalSale = calculateSalesTotal(quantity, sellingPrice);
  const totalCost = calculateTotalCost({
    productionCost: productionCostUnit * quantity,
    courierCost,
    adsCost,
    packagingCost
  });
  const netProfit = calculateNetProfit(totalSale, totalCost);

  const customer =
    typeof customerName === "string" && customerName.trim()
      ? await prisma.customer.create({
          data: {
            name: customerName.trim(),
            mobile: typeof customerMobile === "string" && customerMobile.trim() ? customerMobile.trim() : null
          }
        })
      : null;

  const invoice = await prisma.salesInvoice.create({
    data: {
      invoiceNo: parsed.data.invoiceNo,
      invoiceDate: parsed.data.invoiceDate,
      customerId: customer?.id ?? parsed.data.customerId ?? null,
      paymentStatus: parsed.data.paymentStatus,
      totalSale,
      totalCost,
      netProfit
    }
  });

  await prisma.salesInvoiceItem.create({
    data: {
      salesInvoiceId: invoice.id,
      productVariantId: productVariantId.trim(),
      quantity,
      sellingPrice,
      productionCostUnit,
      courierCost,
      adsCost,
      packagingCost,
      totalSale,
      totalCost,
      netProfit
    }
  });

  await prisma.stockLedger.create({
    data: {
      productVariantId: productVariantId.trim(),
      movementType: "sale_out",
      quantity,
      movementDate: parsed.data.invoiceDate,
      referenceType: "salesInvoice",
      referenceId: invoice.id,
      note: `Invoice ${invoice.invoiceNo} posted`
    }
  });

  await logAuditEvent({ entity: "salesInvoice", action: "create", payload: invoice });
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}

export async function updateSalesInvoice(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const id = formData.get("id");
  const invoiceNo = formData.get("invoiceNo");
  const invoiceDate = formData.get("invoiceDate");
  const customerId = formData.get("customerId");
  const paymentStatus = formData.get("paymentStatus");
  const productVariantId = formData.get("productVariantId");
  const customerName = formData.get("customerName");
  const customerMobile = formData.get("customerMobile");

  const parsed = salesInvoiceSchema.safeParse({
    invoiceNo,
    invoiceDate,
    customerId: typeof customerId === "string" && customerId.trim() ? customerId.trim() : undefined,
    paymentStatus
  });

  if (typeof id !== "string" || !id.trim()) throw new Error("Invoice ID is required");
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid sales invoice");
  if (typeof productVariantId !== "string" || !productVariantId.trim()) throw new Error("Product variant is required");

  const quantity = Number(formData.get("quantity"));
  const sellingPrice = Number(formData.get("sellingPrice"));
  const productionCostUnit = Number(formData.get("productionCostUnit"));
  const courierCost = Number(formData.get("courierCost"));
  const adsCost = Number(formData.get("adsCost"));
  const packagingCost = Number(formData.get("packagingCost"));
  const totalSale = calculateSalesTotal(quantity, sellingPrice);
  const totalCost = calculateTotalCost({
    productionCost: productionCostUnit * quantity,
    courierCost,
    adsCost,
    packagingCost
  });
  const netProfit = calculateNetProfit(totalSale, totalCost);

  const existing = await prisma.salesInvoice.findUnique({
    where: { id: id.trim() },
    include: { items: true }
  });

  if (!existing) throw new Error("Sales invoice not found");

  const customer =
    typeof customerName === "string" && customerName.trim()
      ? await prisma.customer.create({
          data: {
            name: customerName.trim(),
            mobile: typeof customerMobile === "string" && customerMobile.trim() ? customerMobile.trim() : null
          }
        })
      : null;

  await prisma.stockLedger.deleteMany({
    where: {
      referenceType: "salesInvoice",
      referenceId: existing.id
    }
  });

  const invoice = await prisma.salesInvoice.update({
    where: { id: existing.id },
    data: {
      invoiceNo: parsed.data.invoiceNo,
      invoiceDate: parsed.data.invoiceDate,
      customerId: customer?.id ?? parsed.data.customerId ?? existing.customerId,
      paymentStatus: parsed.data.paymentStatus,
      totalSale,
      totalCost,
      netProfit
    }
  });

  await prisma.salesInvoiceItem.deleteMany({
    where: { salesInvoiceId: existing.id }
  });

  await prisma.salesInvoiceItem.create({
    data: {
      salesInvoiceId: invoice.id,
      productVariantId: productVariantId.trim(),
      quantity,
      sellingPrice,
      productionCostUnit,
      courierCost,
      adsCost,
      packagingCost,
      totalSale,
      totalCost,
      netProfit
    }
  });

  await prisma.stockLedger.create({
    data: {
      productVariantId: productVariantId.trim(),
      movementType: "sale_out",
      quantity,
      movementDate: parsed.data.invoiceDate,
      referenceType: "salesInvoice",
      referenceId: invoice.id,
      note: `Invoice ${invoice.invoiceNo} updated`
    }
  });

  await logAuditEvent({ entity: "salesInvoice", action: "update", payload: invoice });
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}

export async function deleteSalesInvoice(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Invoice ID is required");

  await prisma.stockLedger.deleteMany({
    where: {
      referenceType: "salesInvoice",
      referenceId: id.trim()
    }
  });

  await prisma.salesInvoiceItem.deleteMany({
    where: { salesInvoiceId: id.trim() }
  });

  const invoice = await prisma.salesInvoice.delete({
    where: { id: id.trim() }
  });

  await logAuditEvent({ entity: "salesInvoice", action: "delete", payload: invoice });
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}
