import { prisma } from "../db/prisma.js";
import { getCurrentStock } from "../repositories/product.repository.js";
import {
  recordStockAdjustment,
  StockAdjustmentValidationError,
} from "./stock-adjustment.service.js";

async function getVerificationRecords() {
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

  if (!user || !product) {
    throw new Error(
      "Stock adjustment verification requires an active user and product.",
    );
  }

  return {
    user,
    product,
  };
}

async function verifyPositiveAdjustment(): Promise<void> {
  const { user, product } =
    await getVerificationRecords();

  const quantityDelta = 10;

  const stockBefore = await getCurrentStock(product.id);

  const adjustment = await recordStockAdjustment({
    productId: product.id,
    quantityDelta,
    reason: "Positive adjustment verification",
    adjustedBy: user.id,
  });

  const stockAfter = await getCurrentStock(product.id);

  console.log("Positive adjustment verification:");
  console.log({
    adjustmentId: adjustment.id,
    productId: product.id,
    stockBefore,
    quantityDelta,
    stockAfter,
  });

  if (stockAfter !== stockBefore + quantityDelta) {
    throw new Error(
      `Positive adjustment failed: expected ${
        stockBefore + quantityDelta
      }, received ${stockAfter}.`,
    );
  }

  console.log(
    "Positive stock adjustment verification passed.",
  );
}

async function verifyNegativeAdjustment(): Promise<void> {
  const { user, product } =
    await getVerificationRecords();

  const stockBefore = await getCurrentStock(product.id);

  if (stockBefore < 1) {
    throw new Error(
      "Negative adjustment verification requires at least 1 unit of current stock.",
    );
  }

  const quantityDelta = -1;

  const adjustment = await recordStockAdjustment({
    productId: product.id,
    quantityDelta,
    reason: "Negative adjustment verification",
    adjustedBy: user.id,
  });

  const stockAfter = await getCurrentStock(product.id);

  console.log("Negative adjustment verification:");
  console.log({
    adjustmentId: adjustment.id,
    productId: product.id,
    stockBefore,
    quantityDelta,
    stockAfter,
  });

  if (stockAfter !== stockBefore + quantityDelta) {
    throw new Error(
      `Negative adjustment failed: expected ${
        stockBefore + quantityDelta
      }, received ${stockAfter}.`,
    );
  }

  console.log(
    "Negative stock adjustment verification passed.",
  );
}

async function verifyNegativeInventoryRejection(): Promise<void> {
  const { user, product } =
    await getVerificationRecords();

  const adjustmentCountBefore =
    await prisma.stockAdjustment.count();

  const movementCountBefore =
    await prisma.stockMovement.count();

  const stockBefore = await getCurrentStock(product.id);

  const impossibleDelta = -(stockBefore + 1);

  let adjustmentRejected = false;

  try {
    await recordStockAdjustment({
      productId: product.id,
      quantityDelta: impossibleDelta,
      reason: "Intentional negative-stock verification",
      adjustedBy: user.id,
    });
  } catch (error) {
    if (error instanceof StockAdjustmentValidationError) {
      adjustmentRejected = true;

      console.log(
        "Expected negative-inventory rejection occurred:",
      );
      console.log(error.message);
    } else {
      throw error;
    }
  }

  if (!adjustmentRejected) {
    throw new Error(
      "Expected negative-inventory adjustment to be rejected, but it succeeded.",
    );
  }

  const adjustmentCountAfter =
    await prisma.stockAdjustment.count();

  const movementCountAfter =
    await prisma.stockMovement.count();

  const stockAfter = await getCurrentStock(product.id);

  console.log("Negative-inventory rejection verification:");
  console.log({
    productId: product.id,
    impossibleDelta,
    adjustmentCountBefore,
    adjustmentCountAfter,
    movementCountBefore,
    movementCountAfter,
    stockBefore,
    stockAfter,
  });

  if (
    adjustmentCountAfter !== adjustmentCountBefore ||
    movementCountAfter !== movementCountBefore ||
    stockAfter !== stockBefore
  ) {
    throw new Error(
      "Negative-inventory rejection failed: database state changed.",
    );
  }

  console.log(
    "Negative-inventory rejection verification passed.",
  );
}

async function main(): Promise<void> {
  await verifyPositiveAdjustment();
  await verifyNegativeAdjustment();
  await verifyNegativeInventoryRejection();
}

main()
  .catch((error: unknown) => {
    console.error(
      "Stock adjustment verification failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });