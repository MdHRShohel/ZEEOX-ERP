import { z } from "zod";

const money = z.coerce.number().min(0);
const positiveInt = z.coerce.number().int().min(1);
const nonNegInt = z.coerce.number().int().min(0);
const optStr = z.string().optional();
const optDate = z.coerce.date().optional();

// ─── Master Data ──────────────────────────────────────────────────────────────

export const uomSchema = z.object({
  name: z.string().min(2, "Name is required"),
  abbreviation: z.string().min(1).max(10),
  type: z.enum(["count", "weight", "length", "volume"]).default("count"),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: optStr,
});

export const productVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(2, "Name is required"),
  description: optStr,
  categoryId: z.string().min(1, "Category is required"),
  uomId: z.string().min(1, "Unit of measure is required"),
  reorderLevel: nonNegInt.default(0),
  costPrice: money.default(0),
  salePrice: money.default(0),
  isActive: z.coerce.boolean().default(true),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contactName: optStr,
  mobile: optStr,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: optStr,
  taxId: optStr,
  notes: optStr,
  isActive: z.coerce.boolean().default(true),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contactName: optStr,
  mobile: optStr,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: optStr,
  notes: optStr,
  isActive: z.coerce.boolean().default(true),
});

export const warehouseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  location: optStr,
  isDefault: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

// ─── Procurement ──────────────────────────────────────────────────────────────

export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  orderDate: z.coerce.date(),
  expectedDate: optDate,
  notes: optStr,
});

export const purchaseOrderItemSchema = z.object({
  purchaseOrderId: z.string().min(1),
  productVariantId: z.string().min(1, "Product is required"),
  orderedQty: positiveInt,
  unitCost: money,
});

export const goodsReceiptSchema = z.object({
  grnNumber: z.string().min(1, "GRN number is required"),
  purchaseOrderId: z.string().min(1, "Purchase order is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  receiptDate: z.coerce.date(),
  notes: optStr,
});

export const goodsReceiptItemSchema = z.object({
  goodsReceiptId: z.string().min(1),
  productVariantId: z.string().min(1, "Product is required"),
  receivedQty: positiveInt,
  unitCost: money,
});

// ─── Stock ────────────────────────────────────────────────────────────────────

export const stockAdjustmentSchema = z.object({
  productVariantId: z.string().min(1, "Product is required"),
  warehouseId: optStr,
  quantity: z.coerce.number().int().refine((n) => n !== 0, "Quantity cannot be zero"),
  reason: z.string().min(1, "Reason is required"),
  adjustedAt: z.coerce.date().default(() => new Date()),
});

export const openingStockSchema = z.object({
  productVariantId: z.string().min(1),
  warehouseId: optStr,
  quantity: positiveInt,
  unitCost: money.default(0),
});

export const stockTransferSchema = z.object({
  transferNo: z.string().min(1, "Transfer number is required"),
  fromWarehouseId: z.string().min(1, "From warehouse is required"),
  toWarehouseId: z.string().min(1, "To warehouse is required"),
  transferDate: z.coerce.date(),
  notes: optStr,
});

export const stockTransferItemSchema = z.object({
  stockTransferId: z.string().min(1),
  productVariantId: z.string().min(1, "Product is required"),
  quantity: positiveInt,
});

// ─── Sales ────────────────────────────────────────────────────────────────────

export const salesOrderSchema = z.object({
  orderNo: z.string().min(1, "Order number is required"),
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.coerce.date(),
  notes: optStr,
});

export const salesOrderItemSchema = z.object({
  salesOrderId: z.string().min(1),
  productVariantId: z.string().min(1, "Product is required"),
  orderedQty: positiveInt,
  unitPrice: money,
});

export const salesInvoiceSchema = z.object({
  invoiceNo: z.string().min(1, "Invoice number is required"),
  customerId: z.string().min(1, "Customer is required"),
  salesOrderId: optStr,
  invoiceDate: z.coerce.date(),
  dueDate: optDate,
  discountAmt: money.default(0),
  notes: optStr,
});

export const salesInvoiceItemSchema = z.object({
  salesInvoiceId: z.string().min(1),
  productVariantId: z.string().min(1, "Product is required"),
  quantity: positiveInt,
  unitPrice: money,
  costPrice: money.default(0),
});

export const recordPaymentSchema = z.object({
  salesInvoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
});

// ─── Returns ─────────────────────────────────────────────────────────────────

export const returnSchema = z.object({
  returnNo: z.string().min(1, "Return number is required"),
  type: z.enum(["customer_return", "supplier_return"]),
  salesInvoiceId: optStr,
  returnDate: z.coerce.date(),
  reason: optStr,
  notes: optStr,
});

export const returnItemSchema = z.object({
  returnId: z.string().min(1),
  productVariantId: z.string().min(1, "Product is required"),
  quantity: positiveInt,
  unitPrice: money,
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const userCreateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  displayName: z.string().min(2, "Display name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "staff", "viewer"]),
});

export const userUpdateSchema = z.object({
  displayName: z.string().min(2).optional(),
  role: z.enum(["admin", "staff", "viewer"]).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
