import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({
  path: ".env.test",
  override: true,
});

const databaseUrl =
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required from .env.test.",
  );
}

const databaseName = new URL(
  databaseUrl,
).pathname.replace(/^\//, "");

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Refusing to seed non-test database "${databaseName}".`,
  );
}

const { UserRole } = await import(
  "../../generated/prisma/client.js"
);

const { prisma } = await import(
  "./prisma.js"
);

const { recordStockReceipt } =
  await import(
    "../services/stock-receipt.service.js"
  );

async function seedTestDatabase(): Promise<void> {
  const ownerPassword =
    "Owner123!";

  const staffPassword =
    "Staff123!";

  const inactivePassword =
    "Inactive123!";

  const ownerPasswordHash =
    await bcrypt.hash(
      ownerPassword,
      10,
    );

  const staffPasswordHash =
    await bcrypt.hash(
      staffPassword,
      10,
    );

  const inactivePasswordHash =
    await bcrypt.hash(
      inactivePassword,
      10,
    );

  const owner =
    await prisma.user.create({
      data: {
        name: "Test Owner",
        email:
          "owner@tindatrack.test",
        passwordHash:
          ownerPasswordHash,
        role: UserRole.OWNER,
        active: true,
      },
    });

  const staff =
    await prisma.user.create({
      data: {
        name: "Test Staff",
        email:
          "staff@tindatrack.test",
        passwordHash:
          staffPasswordHash,
        role: UserRole.STAFF,
        active: true,
      },
    });

  const inactiveStaff =
    await prisma.user.create({
      data: {
        name: "Inactive Staff",
        email:
          "inactive@tindatrack.test",
        passwordHash:
          inactivePasswordHash,
        role: UserRole.STAFF,
        active: false,
      },
    });

  const supplier =
    await prisma.supplier.create({
      data: {
        name:
          "Sample Wholesale Supplier",
        contactDetails:
          "09170000001",
        active: true,
      },
    });

  const inactiveSupplier =
    await prisma.supplier.create({
      data: {
        name:
          "Inactive Supplier",
        active: false,
      },
    });

  const coke =
    await prisma.product.create({
      data: {
        sku: "COKE-1L",
        name: "Coke 1L",
        category: "Beverages",
        sellingPrice: "75.00",
        reorderLevel: 5,
        active: true,
      },
    });

  const sardines =
    await prisma.product.create({
      data: {
        sku: "SARDINES-155",
        name: "Sardines 155g",
        category: "Canned Goods",
        sellingPrice: "28.50",
        reorderLevel: 10,
        active: true,
      },
    });

  const noodles =
    await prisma.product.create({
      data: {
        sku: "NOODLES-001",
        name: "Instant Noodles",
        category: "Dry Goods",
        sellingPrice: "16.00",
        reorderLevel: 8,
        active: true,
      },
    });

  const inactiveProduct =
    await prisma.product.create({
      data: {
        sku: "INACTIVE-001",
        name: "Inactive Product",
        category: "Testing",
        sellingPrice: "50.00",
        reorderLevel: 5,
        active: false,
      },
    });

  /*
   * Inventory is still established through
   * the real inventory transaction flow.
   */
  await recordStockReceipt({
    supplierId: supplier.id,
    receivedBy: owner.id,
    referenceNo:
      "SEED-RECEIPT-001",
    items: [
      {
        productId: coke.id,
        quantity: 20,
        unitCost: "55.00",
      },
      {
        productId:
          sardines.id,
        quantity: 30,
        unitCost: "20.00",
      },
      {
        productId:
          noodles.id,
        quantity: 15,
        unitCost: "11.50",
      },
    ],
  });

  console.log(
    `Test database "${databaseName}" seeded successfully.`,
  );

  console.log();
  console.log(
    "Test login credentials:",
  );

  console.table([
    {
      role: "OWNER",
      email:
        owner.email,
      password:
        ownerPassword,
    },
    {
      role: "STAFF",
      email:
        staff.email,
      password:
        staffPassword,
    },
    {
      role: "INACTIVE STAFF",
      email:
        inactiveStaff.email,
      password:
        inactivePassword,
    },
  ]);

  console.log();

  console.table([
    {
      id: owner.id,
      type: "User",
      name: owner.name,
      note: "OWNER active",
    },
    {
      id: staff.id,
      type: "User",
      name: staff.name,
      note: "STAFF active",
    },
    {
      id: inactiveStaff.id,
      type: "User",
      name:
        inactiveStaff.name,
      note: "STAFF inactive",
    },
    {
      id: supplier.id,
      type: "Supplier",
      name: supplier.name,
      note: "active",
    },
    {
      id: inactiveSupplier.id,
      type: "Supplier",
      name:
        inactiveSupplier.name,
      note: "inactive",
    },
    {
      id: coke.id,
      type: "Product",
      name: coke.name,
      note: "20 units",
    },
    {
      id: sardines.id,
      type: "Product",
      name: sardines.name,
      note: "30 units",
    },
    {
      id: noodles.id,
      type: "Product",
      name: noodles.name,
      note: "15 units",
    },
    {
      id: inactiveProduct.id,
      type: "Product",
      name:
        inactiveProduct.name,
      note: "inactive",
    },
  ]);
}

seedTestDatabase()
  .catch((error: unknown) => {
    console.error(
      "Test database seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });