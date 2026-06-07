import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getSalesInvoiceDetail } from "@/server/services/sales-service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await requireSession();
  const invoice = await getSalesInvoiceDetail(params.id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const itemRows = invoice.items
    .map(
      (item) => `
      <tr>
        <td>${item.productVariant.sku}</td>
        <td>${item.productVariant.name}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">${Number(item.unitPrice).toFixed(2)}</td>
        <td style="text-align:right">${Number(item.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 14px; color: #111; padding: 40px; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .label { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 2px; }
    .value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    .totals { text-align: right; }
    .totals table { width: auto; margin-left: auto; }
    .totals td { padding: 4px 12px; }
    .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #111; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Sales Invoice</h1>
  <div class="meta">${invoice.invoiceNo}</div>

  <div class="grid">
    <div>
      <div class="label">Bill To</div>
      <div class="value">${invoice.customer.name}</div>
      ${invoice.customer.email ? `<div>${invoice.customer.email}</div>` : ""}
      ${invoice.customer.address ? `<div>${invoice.customer.address}</div>` : ""}
    </div>
    <div>
      <div class="label">Invoice Date</div>
      <div class="value">${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
      ${invoice.dueDate ? `<div class="label" style="margin-top:8px">Due Date</div><div class="value">${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ""}
      <div class="label" style="margin-top:8px">Status</div>
      <div class="value">${invoice.status.toUpperCase()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Product</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td>${Number(invoice.subtotal).toFixed(2)}</td></tr>
      <tr><td>Discount</td><td>${Number(invoice.discountAmt).toFixed(2)}</td></tr>
      <tr class="total-row"><td>Total</td><td>${Number(invoice.totalAmount).toFixed(2)}</td></tr>
      <tr><td>Paid</td><td>${Number(invoice.paidAmount).toFixed(2)}</td></tr>
      <tr><td>Balance Due</td><td>${(Number(invoice.totalAmount) - Number(invoice.paidAmount)).toFixed(2)}</td></tr>
    </table>
  </div>

  ${invoice.notes ? `<div style="margin-top:16px;font-size:13px;color:#555"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
