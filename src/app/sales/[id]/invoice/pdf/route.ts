import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";
import { getSalesInvoiceDetail } from "@/server/services/operations-service";

export const runtime = "nodejs";

function money(value: { toString(): string }) {
  return Number(value.toString()).toLocaleString("en-US");
}

function buildInvoicePdf(invoice: Awaited<ReturnType<typeof getSalesInvoiceDetail>>) {
  return new Promise<Buffer>((resolve, reject) => {
    if (!invoice) {
      reject(new Error("Invoice not found"));
      return;
    }

    const doc = new PDFDocument({ size: "A4", margin: 42 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = 42;
    const right = 553;
    let y = 42;

    doc.fontSize(18).font("Helvetica-Bold").text("ZEEOX Business System", left, y);
    y += 24;
    doc.fontSize(11).font("Helvetica").fillColor("#475569").text("Sales invoice", left, y);
    doc.fillColor("#0f172a");
    y += 22;
    doc.fontSize(20).font("Helvetica-Bold").text(invoice.invoiceNo, left, y);
    y += 28;

    doc.fontSize(10).font("Helvetica").fillColor("#334155");
    doc.text(`Customer: ${invoice.customer?.name ?? "Walk-in customer"}`, left, y);
    doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString()}`, left, y + 14);
    doc.text(`Payment: ${invoice.paymentStatus}`, left, y + 28);
    doc.fillColor("#0f172a");

    y += 58;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#cbd5e1").stroke();
    y += 18;

    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("Item", left, y);
    doc.text("Qty", 278, y, { width: 40, align: "right" });
    doc.text("Sale", 338, y, { width: 70, align: "right" });
    doc.text("Cost", 420, y, { width: 70, align: "right" });
    doc.text("Profit", 502, y, { width: 70, align: "right" });
    y += 14;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#e2e8f0").stroke();
    y += 10;

    invoice.items.forEach((item) => {
      doc.fontSize(10.5).font("Helvetica-Bold");
      doc.text(item.productVariant.model, left, y, { width: 220 });
      doc.font("Helvetica").fontSize(9).fillColor("#64748b");
      doc.text(item.productVariant.sku ?? "", left, y + 13, { width: 220 });
      doc.fillColor("#0f172a");
      doc.fontSize(10.5).font("Helvetica");
      doc.text(String(item.quantity), 278, y, { width: 40, align: "right" });
      doc.text(money(item.totalSale), 338, y, { width: 70, align: "right" });
      doc.text(money(item.totalCost), 420, y, { width: 70, align: "right" });
      doc.text(money(item.netProfit), 502, y, { width: 70, align: "right" });
      y += 34;
    });

    y += 10;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#cbd5e1").stroke();
    y += 16;

    const summary = [
      ["Total sale", money(invoice.totalSale)],
      ["Total cost", money(invoice.totalCost)],
      ["Net profit", money(invoice.netProfit)]
    ];

    summary.forEach(([label, value]) => {
      doc.fontSize(11).font("Helvetica-Bold").text(label, 338, y, { width: 96, align: "right" });
      doc.font("Helvetica").text(value, 440, y, { width: 112, align: "right" });
      y += 16;
    });

    y += 12;
    doc.fontSize(9).fillColor("#64748b").text("Generated for browser download and archive.", left, y);
    doc.end();
  });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const invoice = await getSalesInvoiceDetail(params.id);

  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const pdf = await buildInvoicePdf(invoice);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNo}.pdf"`,
      "Content-Length": String(pdf.byteLength)
    }
  });
}
