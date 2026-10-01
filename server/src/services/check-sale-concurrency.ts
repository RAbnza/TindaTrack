import {
  PaymentMethod,
  StockMovementType,
} from "../../generated/prisma/client.js";

import { prisma } from "../db/prisma.js";
import { getCurrentStock } from "../repositories/product.repository.js";
import { recordStockAdjustment } from "./stock-adjustment.service.js";
import {
  recordSale,
  SaleValidationError,
} from "./sale.service.js";

async function getVerificationRecords() {
  const user = await prisma.user.findFirst({
    where: {
      active: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const product = await prisma.product.findFirst({
    where: {
      active: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!user || !product) {
    throw new Error(
      "Concurrency verification requires an active user and product.",
    );
  }

  return {
    user,
    product,
  };
}

async function setStockToExactlyOne(
  userId: number,
  productId: number,
): Promise<void> {
  const currentStock = await getCurrentStock(
    productId,
  );

  const quantityDelta = 1 - currentStock;

  if (quantityDelta === 0) {
    return;
  }

  await recordStockAdjustment({
    productId,
    quantityDelta,
    reason:
      "Prepare exactly one unit for concurrent sale verification",
    adjustedBy: userId,
  });

  const stockAfter = await getCurrentStock(
    productId,
  );

  if (stockAfter !== 1) {
    throw new Error(
      `Could not prepare concurrency fixture. Expected stock 1, received ${stockAfter}.`,
    );
  }
}

async function runConcurrencyRound(
  round: number,
): Promise<void> {
  const { user, product } =
    await getVerificationRecords();

  await setStockToExactlyOne(
    user.id,
    product.id,
  );

  const stockBefore = await getCurrentStock(
    product.id,
  );

  if (stockBefore !== 1) {
    throw new Error(
      `Round ${round}: expected starting stock 1, received ${stockBefore}.`,
    );
  }

  const saleCountBefore =
    await prisma.sale.count();

  const saleItemCountBefore =
    await prisma.saleItem.count();

  const saleMovementCountBefore =
    await prisma.stockMovement.count({
      where: {
        type: StockMovementType.SALE,
      },
    });

  const saleInput = {
    recordedBy: user.id,
    paymentMethod: PaymentMethod.CASH,
    items: [
      {
        productId: product.id,
        quantity: 1,
      },
    ],
  };

  console.log();
  console.log(
    `Round ${round}: starting two concurrent sales for the final unit...`,
  );

  const results = await Promise.allSettled([
    recordSale(saleInput),
    recordSale(saleInput),
  ]);

  const fulfilledResults = results.filter(
    (result) => result.status === "fulfilled",
  );

  const rejectedResults = results.filter(
    (result) => result.status === "rejected",
  );

  const fulfilledCount = fulfilledResults.length;
  const rejectedCount = rejectedResults.length;

  const saleCountAfter =
    await prisma.sale.count();

  const saleItemCountAfter =
    await prisma.saleItem.count();

  const saleMovementCountAfter =
    await prisma.stockMovement.count({
      where: {
        type: StockMovementType.SALE,
      },
    });

  const currentStock = await getCurrentStock(
    product.id,
  );

  const salesCreated =
    saleCountAfter - saleCountBefore;

  const saleItemsCreated =
    saleItemCountAfter - saleItemCountBefore;

  const saleMovementsCreated =
    saleMovementCountAfter -
    saleMovementCountBefore;

  console.log({
    fulfilledCount,
    rejectedCount,
    salesCreated,
    saleItemsCreated,
    saleMovementsCreated,
    currentStock,
  });

  const invariantSatisfied =
    fulfilledCount === 1 &&
    rejectedCount === 1 &&
    salesCreated === 1 &&
    saleItemsCreated === 1 &&
    saleMovementsCreated === 1 &&
    currentStock === 0;

  if (!invariantSatisfied) {
    throw new Error(
      `Round ${round}: sale concurrency invariant failed. ` +
        `Expected fulfilled=1, rejected=1, salesCreated=1, ` +
        `saleItemsCreated=1, saleMovementsCreated=1, stock=0. ` +
        `Actual fulfilled=${fulfilledCount}, rejected=${rejectedCount}, ` +
        `salesCreated=${salesCreated}, saleItemsCreated=${saleItemsCreated}, ` +
        `saleMovementsCreated=${saleMovementsCreated}, stock=${currentStock}.`,
    );
  }

  const rejectedResult = rejectedResults[0];

  if (
    !rejectedResult ||
    rejectedResult.status !== "rejected"
  ) {
    throw new Error(
      `Round ${round}: expected exactly one rejected sale result.`,
    );
  }

  if (
    !(
      rejectedResult.reason instanceof
      SaleValidationError
    )
  ) {
    throw new Error(
      `Round ${round}: losing concurrent sale did not resolve to the expected SaleValidationError.`,
    );
  }

  if (
    !rejectedResult.reason.message.includes(
      "Insufficient stock",
    )
  ) {
    throw new Error(
      `Round ${round}: losing concurrent sale failed with an unexpected validation message: ${rejectedResult.reason.message}`,
    );
  }

  console.log(
    `Round ${round}: concurrency invariant passed.`,
  );

  console.log(
    `Round ${round}: losing sale retried and resolved to insufficient-stock validation.`,
  );
}

async function main(): Promise<void> {
  const maxRounds = 20;

  for (
    let round = 1;
    round <= maxRounds;
    round += 1
  ) {
    await runConcurrencyRound(round);
  }

  console.log();
  console.log(
    `Sale concurrency verification passed for ${maxRounds} rounds.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      "Sale concurrency verification failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });