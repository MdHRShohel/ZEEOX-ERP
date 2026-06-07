"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, getPermissions } from "@/lib/auth";
import { salesInvoiceSchema, salesInvoiceItemSchema, recordPaymentSchema } from "@/lib/domain-schemas";
import { logAudit } from "@/lib/audit";
import { computeCurrentStock } from "@/lib/calculations";
import { StockMovementType } from "@prisma/client";

async function requireStaff() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSales) throw new Error("Forbidden");
  return session;
}

function computeInvoiceStatus(total: number, paid: number): "unpaid" | "partial" | "paid" {
  if (paid <= 0) return "unpaid";
  if (paid >= total) return "paid";
  return "partial";
}

export async function createSalesInvoice(formData: FormData) {
  const session = await requireStaff();
  const parsed = salesInvoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const invoice = await prisma.salesInvoice.create({
    data: {
      ...parsed.data,
      salesOrderId: parsed.data.salesOrderId || undefined,
      status: "unpaid",
      subtotal: 0,
      totalAmount: 0,
      paidAmount: 0,
      isPosted: false,
    },
  });
  await logAudit({ entityType: "SalesInvoice", entityId: invoice.id, action: "create", actorId: session.id, actorName: session.displayName });
  revalidatePath("/sales/invoices");
  redirect(`/sales/invoices/${invoice.id}`);
}

export async function addSalesInvoiceItem(formData: FormData) {
  const session = await requireStaff();
  const parsed = salesInvoiceItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const invoice = await prisma.salesInvoice.findUnique({ where: { id: parsed.data.salesInvoiceId } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.isPosted) return { error: "Cannot edit a posted invoice" };

  const lineTotal = parsed.data.quantity * parsed.data.unitPrice;
  await prisma.salesInvoiceItem.create({ data: { ...parsed.data, lineTotal } });

  const items = await prisma.salesInvoiceItem.findMany({ where: { salesInvoiceId: invoice.id } });
  const subtotal = items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
  const totalAmount = Math.max(0, subtotal - Number(invoice.discountAmt));
  await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { subtotal, totalAmount } });

  revalidatePath(`/sales/invoices/${invoice.id}`);
  return { success: true };
}

export async function postSalesInvoice(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));

  const invoice = await prisma.salesInvoice.findUnique({
    where: { id },
    include: { items: { include: { productVariant: true } } },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.isPosted) return { error: "Invoice is already posted" };
  if (invoice.items.length === 0) return { error: "Cannot post an empty invoice. Add items first." };

  // Check stock availability for each item
  for (const item of invoice.items) {
    const ledger = await prisma.stockLedger.groupBy({
      by: ["movementType"],
      where: { productVariantId: item.productVariantId },
      _sum: { quantity: true },
    });
    const currentStock = computeCurrentStock(
      ledger.map((l) => ({ movementType: l.movementType as StockMovementType, quantity: l._sum.quantity ?? 0 }))
    );
    if (currentStock < item.quantity) {
      return { error: `Insufficient stock for "${item.productVariant.name}". Available: ${currentStock}, Required: ${item.quantity}` };
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of invoice.items) {
      await tx.stockLedger.create({
        data: {
          productVariantId: item.productVariantId,
          movementType: "sale_out",
          quantity: item.quantity,
          unitCost: item.costPrice,
          referenceType: "salesInvoice",
          referenceId: invoice.id,
          notes: `Invoice: ${invoice.invoiceNo}`,
          movedAt: invoice.invoiceDate,
        },
      });

      if (invoice.salesOrderId) {
        await tx.salesOrderItem.updateMany({
          where: { salesOrderId: invoice.salesOrderId, productVariantId: item.productVariantId },
          data: { invoicedQty: { increment: item.quantity } },
        });
      }
    }

    await tx.salesInvoice.update({ where: { id }, data: { isPosted: true } });

    if (invoice.salesOrderId) {
      const orderItems = await tx.salesOrderItem.findMany({ where: { salesOrderId: invoice.salesOrderId } });
      const allInvoiced = orderItems.every((i) => i.invoicedQty >= i.orderedQty);
      if (allInvoiced) {
        await tx.salesOrder.update({ where: { id: invoice.salesOrderId }, data: { status: "invoiced" } });
      }
    }
  });

  await logAudit({ entityType: "SalesInvoice", entityId: id, action: "post", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/sales/invoices/${id}`);
  revalidatePath("/sales/invoices");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function recordPayment(formData: FormData) {
  const session = await requireStaff();
  const parsed = recordPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const invoice = await prisma.salesInvoice.findUnique({ where: { id: parsed.data.salesInvoiceId } });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "cancelled") return { error: "Cannot record payment on cancelled invoice" };

  const newPaid = Number(invoice.paidAmount) + parsed.data.amount;
  const status = computeInvoiceStatus(Number(invoice.totalAmount), newPaid);
  await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { paidAmount: newPaid, status } });

  await logAudit({ entityType: "SalesInvoice", entityId: invoice.id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/sales/invoices/${invoice.id}`);
  revalidatePath("/sales/invoices");
  return { success: true };
}

export async function cancelSalesInvoice(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id"));
  const invoice = await prisma.salesInvoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!invoice) return { error: "Not found" };
  if (invoice.status === "cancelled") return { error: "Already cancelled" };

  await prisma.$transaction(async (tx) => {
    if (invoice.isPosted) {
      for (const item of invoice.items) {
        await tx.stockLedger.create({
          data: {
            productVariantId: item.productVariantId,
            movementType: "return_in",
            quantity: item.quantity,
            unitCost: item.costPrice,
            referenceType: "invoiceCancellation",
            referenceId: invoice.id,
            notes: `Cancelled invoice: ${invoice.invoiceNo}`,
          },
        });
      }
    }
    await tx.salesInvoice.update({ where: { id }, data: { status: "cancelled" } });
  });

  await logAudit({ entityType: "SalesInvoice", entityId: id, action: "update", actorId: session.id, actorName: session.displayName });
  revalidatePath(`/sales/invoices/${id}`);
  revalidatePath("/sales/invoices");
  revalidatePath("/products");
  return { success: true };
}
