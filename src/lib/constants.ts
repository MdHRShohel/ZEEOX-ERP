export const PURCHASE_ORDER_STATUSES = ["draft", "confirmed", "partial", "received", "cancelled"] as const;
export const GOODS_RECEIPT_STATUSES = ["draft", "posted"] as const;
export const SALES_ORDER_STATUSES = ["draft", "confirmed", "invoiced", "cancelled"] as const;
export const INVOICE_STATUSES = ["unpaid", "partial", "paid", "cancelled"] as const;
export const STOCK_MOVEMENT_TYPES = [
  "opening",
  "purchase_in",
  "production_in",
  "sale_out",
  "return_in",
  "transfer_out",
  "transfer_in",
  "adjustment",
] as const;
export const STOCK_TRANSFER_STATUSES = ["draft", "posted"] as const;
export const UOM_TYPES = ["count", "weight", "length", "volume"] as const;
export const RETURN_TYPES = ["customer_return", "supplier_return"] as const;
export const AUTH_ROLES = ["admin", "staff", "viewer"] as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  partial: "Partial",
  received: "Received",
  cancelled: "Cancelled",
  posted: "Posted",
  invoiced: "Invoiced",
  unpaid: "Unpaid",
  paid: "Paid",
  opening: "Opening",
  purchase_in: "Purchase In",
  production_in: "Production In",
  sale_out: "Sale Out",
  return_in: "Return In",
  transfer_out: "Transfer Out",
  transfer_in: "Transfer In",
  adjustment: "Adjustment",
  customer_return: "Customer Return",
  supplier_return: "Supplier Return",
  admin: "Admin",
  staff: "Staff",
  viewer: "Viewer",
};
