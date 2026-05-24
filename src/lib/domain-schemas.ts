import { z } from "zod";
import { courierStatuses, paymentStatuses } from "@/lib/constants";
import { moneySchema, positiveQuantitySchema } from "@/lib/validators";

export const companySchema = z.object({
  name: z.string().min(2)
});

export const investorSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(2),
  investmentAmount: moneySchema,
  ownershipPercent: z.number().min(0).max(100),
  profitSharePercent: z.number().min(0).max(100)
});

export const productionBatchSchema = z.object({
  productVariantId: z.string().min(1),
  batchDate: z.coerce.date(),
  materialCost: moneySchema,
  laborCost: moneySchema,
  packagingCost: moneySchema,
  otherCost: moneySchema,
  quantity: positiveQuantitySchema
});

export const salesInvoiceSchema = z.object({
  invoiceNo: z.string().min(1),
  invoiceDate: z.coerce.date(),
  customerId: z.string().optional(),
  paymentStatus: z.enum(paymentStatuses)
});

export const courierShipmentSchema = z.object({
  shipmentDate: z.coerce.date(),
  courierName: z.string().min(2),
  trackingId: z.string().optional(),
  status: z.enum(courierStatuses),
  deliveryCharge: moneySchema,
  codCharge: moneySchema,
  returnCharge: moneySchema
});

export const officeExpenseSchema = z.object({
  expenseDate: z.coerce.date(),
  category: z.string().min(2),
  description: z.string().min(2),
  amount: moneySchema
});

export const userRoleSchema = z.enum(["admin", "staff", "viewer"]);

export const userCreateSchema = z.object({
  username: z.string().min(3),
  displayName: z.string().min(2),
  role: userRoleSchema,
  password: z.string().min(8),
  isActive: z.boolean().default(true)
});

export const userUpdateSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3),
  displayName: z.string().min(2),
  role: userRoleSchema,
  password: z.string().min(8).optional(),
  isActive: z.boolean().default(true)
});
