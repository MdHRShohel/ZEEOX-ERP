-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'partial', 'paid', 'returned', 'cancelled');

-- CreateEnum
CREATE TYPE "CourierStatus" AS ENUM ('pending', 'dispatched', 'in_transit', 'delivered', 'returned', 'failed');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('opening', 'production_in', 'sale_out', 'return_in', 'adjustment');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "investmentAmount" DECIMAL(12,2) NOT NULL,
    "ownershipPercent" DECIMAL(5,2) NOT NULL,
    "profitSharePercent" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "sku" TEXT,
    "openingStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionBatch" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "batchDate" TIMESTAMP(3) NOT NULL,
    "materialCost" DECIMAL(12,2) NOT NULL,
    "laborCost" DECIMAL(12,2) NOT NULL,
    "packagingCost" DECIMAL(12,2) NOT NULL,
    "otherCost" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLedger" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "movementType" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "customerId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "totalSale" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "netProfit" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesInvoiceItem" (
    "id" TEXT NOT NULL,
    "salesInvoiceId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "productionCostUnit" DECIMAL(12,2) NOT NULL,
    "courierCost" DECIMAL(12,2) NOT NULL,
    "adsCost" DECIMAL(12,2) NOT NULL,
    "packagingCost" DECIMAL(12,2) NOT NULL,
    "totalSale" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "netProfit" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierShipment" (
    "id" TEXT NOT NULL,
    "salesInvoiceId" TEXT,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "courierName" TEXT NOT NULL,
    "trackingId" TEXT,
    "status" "CourierStatus" NOT NULL,
    "deliveryCharge" DECIMAL(12,2) NOT NULL,
    "codCharge" DECIMAL(12,2) NOT NULL,
    "returnCharge" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeExpense" (
    "id" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investor_companyId_idx" ON "Investor"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_categoryId_idx" ON "ProductVariant"("categoryId");

-- CreateIndex
CREATE INDEX "ProductionBatch_productVariantId_idx" ON "ProductionBatch"("productVariantId");

-- CreateIndex
CREATE INDEX "StockLedger_productVariantId_idx" ON "StockLedger"("productVariantId");

-- CreateIndex
CREATE INDEX "StockLedger_movementType_idx" ON "StockLedger"("movementType");

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_invoiceNo_key" ON "SalesInvoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "SalesInvoice_customerId_idx" ON "SalesInvoice"("customerId");

-- CreateIndex
CREATE INDEX "SalesInvoiceItem_salesInvoiceId_idx" ON "SalesInvoiceItem"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "SalesInvoiceItem_productVariantId_idx" ON "SalesInvoiceItem"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "CourierShipment_salesInvoiceId_key" ON "CourierShipment"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "CourierShipment_status_idx" ON "CourierShipment"("status");

-- AddForeignKey
ALTER TABLE "Investor" ADD CONSTRAINT "Investor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatch" ADD CONSTRAINT "ProductionBatch_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoiceItem" ADD CONSTRAINT "SalesInvoiceItem_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoiceItem" ADD CONSTRAINT "SalesInvoiceItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierShipment" ADD CONSTRAINT "CourierShipment_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
