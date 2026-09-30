import { config } from "dotenv";

config({
  path: ".env.test",
  override: true,
});

const databaseUrl = process.env.DATABASE_URL;

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
    `Refusing to reset non-test database "${databaseName}".`,
  );
}

const { prisma } = await import("./prisma.js");

async function resetTestDatabase(): Promise<void> {
  /*
   * Delete children before parents because the schema uses
   * restrictive foreign keys.
   */
  await prisma.stockMovement.deleteMany();

  await prisma.stockAdjustment.deleteMany();

  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();

  await prisma.stockReceiptItem.deleteMany();
  await prisma.stockReceipt.deleteMany();

  await prisma.auditLog.deleteMany();

  await prisma.supplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log(
    `Test database "${databaseName}" cleared.`,
  );
}

resetTestDatabase()
  .catch((error: unknown) => {
    console.error("Test database reset failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });