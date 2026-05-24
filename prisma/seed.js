const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");
const { existsSync, readFileSync } = require("fs");
const { resolve } = require("path");

const prisma = new PrismaClient();

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to seed bootstrap users.`);
  }
  return value;
}

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  loadDotEnv();

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const adminUsername = requireEnv("AUTH_ADMIN_USERNAME");
    const adminPassword = requireEnv("AUTH_ADMIN_PASSWORD");
    const staffUsername = requireEnv("AUTH_STAFF_USERNAME");
    const staffPassword = requireEnv("AUTH_STAFF_PASSWORD");
    const viewerUsername = requireEnv("AUTH_VIEWER_USERNAME");
    const viewerPassword = requireEnv("AUTH_VIEWER_PASSWORD");

    await prisma.user.createMany({
      data: [
        {
          username: adminUsername,
          displayName: "Administrator",
          role: "admin",
          passwordHash: hashPassword(adminPassword),
          isActive: true
        },
        {
          username: staffUsername,
          displayName: "Staff User",
          role: "staff",
          passwordHash: hashPassword(staffPassword),
          isActive: true
        },
        {
          username: viewerUsername,
          displayName: "Viewer User",
          role: "viewer",
          passwordHash: hashPassword(viewerPassword),
          isActive: true
        }
      ]
    });
  }

  const companyCount = await prisma.company.count();
  if (companyCount === 0) {
    const company = await prisma.company.create({
      data: {
        name: "ZEEOX Leather Business"
      }
    });

    await prisma.investor.createMany({
      data: [
        {
          companyId: company.id,
          name: "Md Rabiul Islam",
          investmentAmount: 20000,
          ownershipPercent: 50,
          profitSharePercent: 50,
          notes: "Primary investor"
        },
        {
          companyId: company.id,
          name: "Shuvo",
          investmentAmount: 90000,
          ownershipPercent: 25,
          profitSharePercent: 25,
          notes: "Investor partner"
        },
        {
          companyId: company.id,
          name: "Rakib",
          investmentAmount: 30000,
          ownershipPercent: 25,
          profitSharePercent: 25,
          notes: "Investor partner"
        }
      ]
    });
  }

  const categoryCount = await prisma.productCategory.count();
  if (categoryCount === 0) {
    const belt = await prisma.productCategory.create({ data: { name: "Belt" } });
    const wallet = await prisma.productCategory.create({ data: { name: "Wallet" } });

    const beltVariant = await prisma.productVariant.create({
      data: {
        categoryId: belt.id,
        model: "BELT-001",
        color: "Black",
        size: "M",
        sku: "BELT-001-BLK-M",
        openingStock: 120,
        reorderLevel: 20
      }
    });

    const walletVariant = await prisma.productVariant.create({
      data: {
        categoryId: wallet.id,
        model: "WALLET-001",
        color: "Brown",
        size: "Standard",
        sku: "WALLET-001-BRN",
        openingStock: 80,
        reorderLevel: 15
      }
    });

    await prisma.productionBatch.create({
      data: {
        productVariantId: beltVariant.id,
        batchDate: new Date(),
        materialCost: 15000,
        laborCost: 6000,
        packagingCost: 2500,
        otherCost: 900,
        quantity: 80,
        note: "Initial belt production batch"
      }
    });

    await prisma.productionBatch.create({
      data: {
        productVariantId: walletVariant.id,
        batchDate: new Date(),
        materialCost: 18000,
        laborCost: 5000,
        packagingCost: 1500,
        otherCost: 700,
        quantity: 60,
        note: "Initial wallet production batch"
      }
    });
  }

  const customerCount = await prisma.customer.count();
  if (customerCount === 0) {
    const customer = await prisma.customer.create({
      data: {
        name: "Sample Customer",
        mobile: "01700000000"
      }
    });

    const beltVariant = await prisma.productVariant.findFirst({
      where: { sku: "BELT-001-BLK-M" }
    });

    if (beltVariant) {
      const invoice = await prisma.salesInvoice.create({
        data: {
          invoiceNo: "INV-0001",
          customerId: customer.id,
          invoiceDate: new Date(),
          paymentStatus: "partial",
          totalSale: 5000,
          totalCost: 3200,
          netProfit: 1800
        }
      });

      await prisma.salesInvoiceItem.create({
        data: {
          salesInvoiceId: invoice.id,
          productVariantId: beltVariant.id,
          quantity: 4,
          sellingPrice: 1250,
          productionCostUnit: 620,
          courierCost: 150,
          adsCost: 100,
          packagingCost: 50,
          totalSale: 5000,
          totalCost: 3200,
          netProfit: 1800
        }
      });

      await prisma.stockLedger.create({
        data: {
          productVariantId: beltVariant.id,
          movementType: "sale_out",
          quantity: 4,
          movementDate: new Date(),
          referenceType: "salesInvoice",
          referenceId: invoice.id,
          note: "Seed invoice stock deduction"
        }
      });

      await prisma.courierShipment.create({
        data: {
          salesInvoiceId: invoice.id,
          shipmentDate: new Date(),
          courierName: "Steadfast",
          trackingId: "SEED-TRACK-001",
          status: "delivered",
          deliveryCharge: 120,
          codCharge: 30,
          returnCharge: 0
        }
      });
    }
  }

  const expenseCount = await prisma.officeExpense.count();
  if (expenseCount === 0) {
    await prisma.officeExpense.createMany({
      data: [
        {
          expenseDate: new Date(),
          category: "Rent",
          description: "Office rent",
          amount: 12000
        },
        {
          expenseDate: new Date(),
          category: "Utilities",
          description: "Electricity and internet",
          amount: 4800
        }
      ]
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
