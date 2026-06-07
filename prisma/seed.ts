import { PrismaClient } from "@prisma/client";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(plain, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Units of Measure
  const [pcs, kg, box, ltr, mtr] = await Promise.all([
    prisma.unitOfMeasure.upsert({
      where: { abbreviation: "pcs" },
      update: {},
      create: { name: "Piece", abbreviation: "pcs", type: "count" },
    }),
    prisma.unitOfMeasure.upsert({
      where: { abbreviation: "kg" },
      update: {},
      create: { name: "Kilogram", abbreviation: "kg", type: "weight" },
    }),
    prisma.unitOfMeasure.upsert({
      where: { abbreviation: "box" },
      update: {},
      create: { name: "Box", abbreviation: "box", type: "count" },
    }),
    prisma.unitOfMeasure.upsert({
      where: { abbreviation: "ltr" },
      update: {},
      create: { name: "Litre", abbreviation: "ltr", type: "volume" },
    }),
    prisma.unitOfMeasure.upsert({
      where: { abbreviation: "mtr" },
      update: {},
      create: { name: "Metre", abbreviation: "mtr", type: "length" },
    }),
  ]);
  console.log("  ✔ UoMs seeded");

  // Product Categories
  const [electronics, clothing, food, rawMat, packaging] = await Promise.all([
    prisma.productCategory.upsert({
      where: { name: "Electronics" },
      update: {},
      create: { name: "Electronics", description: "Electronic devices and components" },
    }),
    prisma.productCategory.upsert({
      where: { name: "Clothing" },
      update: {},
      create: { name: "Clothing", description: "Apparel and garments" },
    }),
    prisma.productCategory.upsert({
      where: { name: "Food & Beverage" },
      update: {},
      create: { name: "Food & Beverage", description: "Food and drink products" },
    }),
    prisma.productCategory.upsert({
      where: { name: "Raw Materials" },
      update: {},
      create: { name: "Raw Materials", description: "Raw materials for production" },
    }),
    prisma.productCategory.upsert({
      where: { name: "Packaging" },
      update: {},
      create: { name: "Packaging", description: "Packaging materials" },
    }),
  ]);
  console.log("  ✔ Categories seeded");

  // Default Warehouse
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { name: "Main Warehouse" },
    update: {},
    create: { name: "Main Warehouse", location: "Building A, Ground Floor", isDefault: true },
  });
  console.log("  ✔ Warehouse seeded");

  // Admin User
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "admin123";
  const staffPassword = process.env.STAFF_SEED_PASSWORD ?? "staff123";

  const adminHash = await hashPassword(adminPassword);
  const staffHash = await hashPassword(staffPassword);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminHash },
    create: { username: "admin", displayName: "Administrator", passwordHash: adminHash, role: "admin" },
  });

  await prisma.user.upsert({
    where: { username: "staff" },
    update: { passwordHash: staffHash },
    create: { username: "staff", displayName: "Staff Member", passwordHash: staffHash, role: "staff" },
  });

  await prisma.user.upsert({
    where: { username: "viewer" },
    update: { passwordHash: staffHash },
    create: { username: "viewer", displayName: "Viewer Account", passwordHash: staffHash, role: "viewer" },
  });
  console.log("  ✔ Users seeded (admin/staff/viewer)");

  // Sample Supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-1" },
    update: {},
    create: {
      id: "seed-supplier-1",
      name: "Sample Supplier Co.",
      contactName: "John Smith",
      mobile: "+1-555-0100",
      email: "supplier@example.com",
      address: "123 Supplier Street, Industrial Zone",
    },
  });

  // Sample Customer
  const customer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      name: "Sample Customer Ltd.",
      contactName: "Jane Doe",
      mobile: "+1-555-0200",
      email: "customer@example.com",
      address: "456 Customer Ave, Business District",
    },
  });
  console.log("  ✔ Supplier & Customer seeded");

  // Sample Products
  await prisma.productVariant.upsert({
    where: { sku: "PROD-001" },
    update: {},
    create: {
      sku: "PROD-001",
      name: "USB-C Hub 7-Port",
      description: "7-port USB-C hub with HDMI, USB 3.0, and SD card slots",
      categoryId: electronics.id,
      uomId: pcs.id,
      reorderLevel: 10,
      costPrice: 25.00,
      salePrice: 49.99,
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "PROD-002" },
    update: {},
    create: {
      sku: "PROD-002",
      name: "Cotton T-Shirt (M)",
      description: "100% cotton medium-weight t-shirt, medium size",
      categoryId: clothing.id,
      uomId: pcs.id,
      reorderLevel: 20,
      costPrice: 8.50,
      salePrice: 19.99,
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "PROD-003" },
    update: {},
    create: {
      sku: "PROD-003",
      name: "Premium Coffee Beans",
      description: "Single origin Arabica coffee beans, 1kg bag",
      categoryId: food.id,
      uomId: kg.id,
      reorderLevel: 15,
      costPrice: 12.00,
      salePrice: 24.99,
    },
  });
  console.log("  ✔ Sample products seeded");

  console.log("\n✅ Seed complete!");
  console.log("  Login: admin / " + adminPassword);
  console.log("  Login: staff / " + staffPassword);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
