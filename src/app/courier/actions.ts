"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { courierShipmentSchema } from "@/lib/domain-schemas";
import { calculateCourierTotal } from "@/lib/calculations";
import { hasOperationsDatabase } from "@/server/services/operations-service";
import { logAuditEvent } from "@/server/services/audit-service";
import { canManageScope, getSessionUser } from "@/lib/auth";

function requireDatabase() {
  if (!hasOperationsDatabase()) {
    throw new Error("DATABASE_URL is required to create courier records.");
  }
}

async function requireOperationsAccess() {
  const user = await getSessionUser();
  if (!user || !canManageScope(user.role, "operations")) {
    throw new Error("You do not have permission to manage courier records.");
  }
}

export async function createCourierShipment(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const shipmentDate = formData.get("shipmentDate");
  const courierName = formData.get("courierName");
  const trackingId = formData.get("trackingId");
  const status = formData.get("status");
  const salesInvoiceId = formData.get("salesInvoiceId");

  const parsed = courierShipmentSchema.safeParse({
    shipmentDate,
    courierName,
    trackingId: typeof trackingId === "string" && trackingId.trim() ? trackingId.trim() : undefined,
    status,
    deliveryCharge: Number(formData.get("deliveryCharge")),
    codCharge: Number(formData.get("codCharge")),
    returnCharge: Number(formData.get("returnCharge"))
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid courier shipment");
  }

  const shipment = await prisma.courierShipment.create({
    data: {
      salesInvoiceId: typeof salesInvoiceId === "string" && salesInvoiceId.trim() ? salesInvoiceId.trim() : null,
      ...parsed.data
    }
  });

  const courierCost = calculateCourierTotal({
    deliveryCharge: Number(shipment.deliveryCharge),
    codCharge: Number(shipment.codCharge),
    returnCharge: Number(shipment.returnCharge)
  });

  await logAuditEvent({ entity: "courierShipment", action: "create", payload: { ...shipment, courierCost } });
  revalidatePath("/courier");
  revalidatePath("/dashboard");
  revalidatePath("/sales");
}

export async function updateCourierShipment(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const id = formData.get("id");
  const shipmentDate = formData.get("shipmentDate");
  const courierName = formData.get("courierName");
  const trackingId = formData.get("trackingId");
  const status = formData.get("status");
  const salesInvoiceId = formData.get("salesInvoiceId");

  const parsed = courierShipmentSchema.safeParse({
    shipmentDate,
    courierName,
    trackingId: typeof trackingId === "string" && trackingId.trim() ? trackingId.trim() : undefined,
    status,
    deliveryCharge: Number(formData.get("deliveryCharge")),
    codCharge: Number(formData.get("codCharge")),
    returnCharge: Number(formData.get("returnCharge"))
  });

  if (typeof id !== "string" || !id.trim()) throw new Error("Shipment ID is required");
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid courier shipment");

  const shipment = await prisma.courierShipment.update({
    where: { id: id.trim() },
    data: {
      salesInvoiceId: typeof salesInvoiceId === "string" && salesInvoiceId.trim() ? salesInvoiceId.trim() : null,
      ...parsed.data
    }
  });

  const courierCost = calculateCourierTotal({
    deliveryCharge: Number(shipment.deliveryCharge),
    codCharge: Number(shipment.codCharge),
    returnCharge: Number(shipment.returnCharge)
  });

  await logAuditEvent({ entity: "courierShipment", action: "update", payload: { ...shipment, courierCost } });
  revalidatePath("/courier");
  revalidatePath("/dashboard");
  revalidatePath("/sales");
}

export async function deleteCourierShipment(formData: FormData) {
  await requireOperationsAccess();
  requireDatabase();

  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Shipment ID is required");

  const shipment = await prisma.courierShipment.delete({
    where: { id: id.trim() }
  });

  await logAuditEvent({ entity: "courierShipment", action: "delete", payload: shipment });
  revalidatePath("/courier");
  revalidatePath("/dashboard");
  revalidatePath("/sales");
}
