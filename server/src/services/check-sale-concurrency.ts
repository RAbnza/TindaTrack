import {
  PaymentMethod,
  StockMovementType,
} from "../../generated/prisma/client.js";

import { prisma } from "../db/prisma.js";
import { getCurrentStock } from "../repositories/product.repository.js";
import { recordStockAdjustment } from "./stock-adjustment.service.js";
import { recordSale } from "./sale.service.js";

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
  const currentStock = await getCurrentStock(productId);

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

  const stockAfter = await getCurrentStock(productId);

  if (stockAfter !== 1) {
    throw new Error(
      `Could not prepare concurrency fixture. Expected stock 1, received ${stockAfter}.`,
    );
  }
}

async function runConcurrencyRound(
  round: number,
): Promise<boolean> {
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

  const fulfilledCount = results.filter(
    (result) => result.status === "fulfilled",
  ).length;

  const rejectedCount = results.filter(
    (result) => result.status === "rejected",
  ).length;

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

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.log(
        `Sale ${index + 1} rejected:`,
        result.reason instanceof Error
          ? result.reason.message
          : result.reason,
      );
    }
  }

  const invariantSatisfied =
    fulfilledCount === 1 &&
    rejectedCount === 1 &&
    salesCreated === 1 &&
    saleItemsCreated === 1 &&
    saleMovementsCreated === 1 &&
    currentStock === 0;

  if (invariantSatisfied) {
    console.log(
      `Round ${round}: concurrency invariant held.`,
    );

    return false;
  }

  console.log();
  console.log(
    "!!! CONCURRENCY BUG OBSERVED !!!",
  );

  console.log({
    expected: {
      fulfilledCount: 1,
      rejectedCount: 1,
      salesCreated: 1,
      saleItemsCreated: 1,
      saleMovementsCreated: 1,
      currentStock: 0,
    },
    actual: {
      fulfilledCount,
      rejectedCount,
      salesCreated,
      saleItemsCreated,
      saleMovementsCreated,
      currentStock,
    },
  });

  return true;
}

async function main(): Promise<void> {
  /*
   * Concurrency bugs are timing-dependent.
   *
   * Run several rounds to make the stale-read race easier
   * to observe under READ COMMITTED.
   */
  const maxRounds = 20;

  let raceObserved = false;

  for (
    let round = 1;
    round <= maxRounds;
    round += 1
  ) {
    const observed =
      await runConcurrencyRound(round);

    if (observed) {
      raceObserved = true;
      break;
    }
  }

  if (!raceObserved) {
    console.log();
    console.log(
      `The race was not reproduced in ${maxRounds} rounds.`,
    );

    console.log(
      "That does NOT prove the current implementation is safe; concurrency races are scheduling-dependent.",
    );

    return;
  }

  console.log();
  console.log(
    "The current sale implementation failed the required concurrency invariant.",
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