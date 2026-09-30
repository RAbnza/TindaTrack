import { prisma } from "../db/prisma.js";
import { getCurrentStock } from "../repositories/product.repository.js";
import { recordStockReceipt } from "./stock-receipt.service.js";

async function verifySuccessfulReceipt(): Promise<void> {
  const supplier = await prisma.supplier.findFirst({
    where: {
      active: true,
    },
  });

  const user = await prisma.user.findFirst({
    where: {
      active: true,
    },
  });

  const product = await prisma.product.findFirst({
    where: {
      active: true,
    },
  });

  if (!supplier || !user || !product) {
    throw new Error(
      "Verification requires an active supplier, user, and product.",
    );
  }

  const quantityReceived = 3;

  const stockBefore = await getCurrentStock(product.id);

  const receipt = await recordStockReceipt({
    supplierId: supplier.id,
    receivedBy: user.id,
    referenceNo: `VERIFY-${Date.now()}`,
    items: [
      {
        productId: product.id,
        quantity: quantityReceived,
        unitCost: "15.50",
      },
    ],
  });

  const stockAfter = await getCurrentStock(product.id);

  console.log("Successful receipt verification:");
  console.log({
    receiptId: receipt.id,
    productId: product.id,
    stockBefore,
    quantityReceived,
    stockAfter,
  });

  if (stockAfter !== stockBefore + quantityReceived) {
    throw new Error(
      `Inventory verification failed: expected ${
        stockBefore + quantityReceived
      }, received ${stockAfter}.`,
    );
  }

  console.log("Stock receipt verification passed.");
}

async function verifyRollback(): Promise<void> {
  const supplier = await prisma.supplier.findFirst({
    where: {
      active: true,
    },
  });

  const user = await prisma.user.findFirst({
    where: {
      active: true,
    },
  });

  const products = await prisma.product.findMany({
    where: {
      active: true,
    },
    orderBy: {
      id: "asc",
    },
    take: 2,
  });

  if (!supplier || !user || products.length < 2) {
    throw new Error(
      "Rollback verification requires an active supplier, user, and at least two active products.",
    );
  }

  const [firstProduct, secondProduct] = products;

  if (!firstProduct || !secondProduct) {
    throw new Error(
      "Rollback verification could not select two products.",
    );
  }

  const receiptCountBefore =
    await prisma.stockReceipt.count();

  const itemCountBefore =
    await prisma.stockReceiptItem.count();

  const movementCountBefore =
    await prisma.stockMovement.count();

  const firstStockBefore = await getCurrentStock(
    firstProduct.id,
  );

  const secondStockBefore = await getCurrentStock(
    secondProduct.id,
  );

  let transactionFailed = false;

  try {
    await recordStockReceipt({
      supplierId: supplier.id,
      receivedBy: user.id,
      referenceNo: "INTENTIONAL-ROLLBACK-TEST",
      items: [
        {
          productId: firstProduct.id,
          quantity: 5,
          unitCost: "15.50",
        },
        {
          productId: secondProduct.id,
          quantity: 2,

          // Intentionally exceeds NUMERIC(12,2).
          unitCost: "10000000000.00",
        },
      ],
    });
  } catch (error) {
    transactionFailed = true;

    console.log("Expected transaction failure occurred.");

    if (error instanceof Error) {
      console.log(error.message);
    }
  }

  if (!transactionFailed) {
    throw new Error(
      "Expected receipt creation to fail, but it succeeded.",
    );
  }

  const receiptCountAfter =
    await prisma.stockReceipt.count();

  const itemCountAfter =
    await prisma.stockReceiptItem.count();

  const movementCountAfter =
    await prisma.stockMovement.count();

  const firstStockAfter = await getCurrentStock(
    firstProduct.id,
  );

  const secondStockAfter = await getCurrentStock(
    secondProduct.id,
  );

  console.log("Rollback verification:");
  console.log({
    receiptCountBefore,
    receiptCountAfter,
    itemCountBefore,
    itemCountAfter,
    movementCountBefore,
    movementCountAfter,
    firstProduct: {
      productId: firstProduct.id,
      stockBefore: firstStockBefore,
      stockAfter: firstStockAfter,
    },
    secondProduct: {
      productId: secondProduct.id,
      stockBefore: secondStockBefore,
      stockAfter: secondStockAfter,
    },
  });

  if (
    receiptCountAfter !== receiptCountBefore ||
    itemCountAfter !== itemCountBefore ||
    movementCountAfter !== movementCountBefore ||
    firstStockAfter !== firstStockBefore ||
    secondStockAfter !== secondStockBefore
  ) {
    throw new Error(
      "Rollback verification failed: database state changed.",
    );
  }

  console.log("Rollback verification passed.");
}

async function main(): Promise<void> {
  await verifySuccessfulReceipt();
  await verifyRollback();
}

main()
  .catch((error: unknown) => {
    console.error(
      "Stock receipt verification failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });