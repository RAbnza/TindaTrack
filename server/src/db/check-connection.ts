import { prisma } from "./prisma.js";

async function main(): Promise<void> {
  const products = await prisma.product.findMany({
    take: 5,
    select: {
      id: true,
      sku: true,
      name: true,
    },
  });

  console.log("Database connection successful.");
  console.log(products);
}

main()
  .catch((error: unknown) => {
    console.error("Database connectivity check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });