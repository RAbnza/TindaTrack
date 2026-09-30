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

  if (!user || products.length < 2) {
    throw new Error(
      "Sale verification requires an active user and at least two active products.",
    );
  }

  const [firstProduct, secondProduct] = products;

  if (!firstProduct || !secondProduct) {
    throw new Error(
      "Sale verification could not select two products.",
    );
  }

  return {
    user,
    firstProduct,
    secondProduct,
  };
}

async function ensureMinimumStock(
  userId: number,
  productId: number,
  minimumStock: number,
): Promise<void> {
  const currentStock = await getCurrentStock(
    productId,
  );

  if (currentStock >= minimumStock) {
    return;
  }

  await recordStockAdjustment({
    productId,
    quantityDelta: minimumStock - currentStock,
    reason: "Prepare stock for sale verification",
    adjustedBy: userId,
  });
}

async function verifySuccessfulSale(): Promise<void> {
  const {
    user,
    firstProduct,
    secondProduct,
  } = await getVerificationRecords();

  const firstQuantity = 2;
  const secondQuantity = 3;

  await ensureMinimumStock(
    user.id,
    firstProduct.id,
    firstQuantity,
  );

  await ensureMinimumStock(
    user.id,
    secondProduct.id,
    secondQuantity,
  );

  const firstStockBefore = await getCurrentStock(
    firstProduct.id,
  );

  const secondStockBefore = await getCurrentStock(
    secondProduct.id,
  );

  /*
   * These extra money fields intentionally simulate
   * untrusted caller values.
   *
   * recordSale() does not read them.
   */
  const untrustedCallerInput = {
    recordedBy: user.id,
    paymentMethod: PaymentMethod.CASH,

    totalAmount: "0.01",

    items: [
      {
        productId: firstProduct.id,
        quantity: firstQuantity,

        unitPrice: "0.01",
        lineTotal: "0.02",
      },
      {
        productId: secondProduct.id,
        quantity: secondQuantity,

        unitPrice: "999999.99",
        lineTotal: "999999.99",
      },
    ],
  };

  const sale = await recordSale(
    untrustedCallerInput,
  );

  const persistedSale =
    await prisma.sale.findUnique({
      where: {
        id: sale.id,
      },
      include: {
        saleItems: {
          orderBy: {
            productId: "asc",
          },
          include: {
            stockMovement: true,
          },
        },
      },
    });

  if (!persistedSale) {
    throw new Error(
      "Successful sale verification failed: Sale was not found.",
    );
  }

  if (persistedSale.saleItems.length !== 2) {
    throw new Error(
      `Expected 2 SaleItems, found ${persistedSale.saleItems.length}.`,
    );
  }

  const expectedByProductId = new Map([
    [
      firstProduct.id,
      {
        quantity: firstQuantity,
        unitPrice: firstProduct.sellingPrice,
        lineTotal: firstProduct.sellingPrice.mul(
          firstQuantity,
        ),
      },
    ],
    [
      secondProduct.id,
      {
        quantity: secondQuantity,
        unitPrice: secondProduct.sellingPrice,
        lineTotal: secondProduct.sellingPrice.mul(
          secondQuantity,
        ),
      },
    ],
  ]);

  let expectedTotal =
    firstProduct.sellingPrice.mul(
      firstQuantity,
    );

  expectedTotal = expectedTotal.add(
    secondProduct.sellingPrice.mul(
      secondQuantity,
    ),
  );

  if (
    !persistedSale.totalAmount.equals(
      expectedTotal,
    )
  ) {
    throw new Error(
      `Sale total mismatch. Expected ${expectedTotal.toString()}, received ${persistedSale.totalAmount.toString()}.`,
    );
  }

  for (const saleItem of persistedSale.saleItems) {
    const expected = expectedByProductId.get(
      saleItem.productId,
    );

    if (!expected) {
      throw new Error(
        `Unexpected SaleItem product ${saleItem.productId}.`,
      );
    }

    if (
      !saleItem.unitPrice.equals(
        expected.unitPrice,
      )
    ) {
      throw new Error(
        `SaleItem ${saleItem.id} did not use Product.sellingPrice.`,
      );
    }

    if (
      !saleItem.lineTotal.equals(
        expected.lineTotal,
      )
    ) {
      throw new Error(
        `SaleItem ${saleItem.id} lineTotal is incorrect.`,
      );
    }

    if (
      saleItem.quantity !== expected.quantity
    ) {
      throw new Error(
        `SaleItem ${saleItem.id} quantity is incorrect.`,
      );
    }

    const movement = saleItem.stockMovement;

    if (!movement) {
      throw new Error(
        `SaleItem ${saleItem.id} has no StockMovement.`,
      );
    }

    if (
      movement.type !==
      StockMovementType.SALE
    ) {
      throw new Error(
        `SaleItem ${saleItem.id} movement is not SALE.`,
      );
    }

    if (
      movement.quantityDelta !==
      -saleItem.quantity
    ) {
      throw new Error(
        `SaleItem ${saleItem.id} movement quantity is incorrect.`,
      );
    }

    if (
      movement.saleItemId !== saleItem.id
    ) {
      throw new Error(
        `Movement is not linked to SaleItem ${saleItem.id}.`,
      );
    }

    if (
      movement.actorId !== user.id
    ) {
      throw new Error(
        `Sale movement actor is incorrect.`,
      );
    }
  }

  const firstStockAfter = await getCurrentStock(
    firstProduct.id,
  );

  const secondStockAfter = await getCurrentStock(
    secondProduct.id,
  );

  console.log("Successful sale verification:");
  console.log({
    saleId: persistedSale.id,

    totalAmount:
      persistedSale.totalAmount.toString(),

    firstProduct: {
      productId: firstProduct.id,
      sellingPrice:
        firstProduct.sellingPrice.toString(),
      stockBefore: firstStockBefore,
      quantitySold: firstQuantity,
      stockAfter: firstStockAfter,
    },

    secondProduct: {
      productId: secondProduct.id,
      sellingPrice:
        secondProduct.sellingPrice.toString(),
      stockBefore: secondStockBefore,
      quantitySold: secondQuantity,
      stockAfter: secondStockAfter,
    },
  });

  if (
    firstStockAfter !==
    firstStockBefore - firstQuantity
  ) {
    throw new Error(
      "First Product stock did not decrease correctly.",
    );
  }

  if (
    secondStockAfter !==
    secondStockBefore - secondQuantity
  ) {
    throw new Error(
      "Second Product stock did not decrease correctly.",
    );
  }

  console.log(
    "Successful multi-item sale verification passed.",
  );
}

async function verifyInsufficientStockRollback(): Promise<void> {
  const {
    user,
    firstProduct,
    secondProduct,
  } = await getVerificationRecords();

  await ensureMinimumStock(
    user.id,
    firstProduct.id,
    1,
  );

  const firstStockBefore = await getCurrentStock(
    firstProduct.id,
  );

  const secondStockBefore = await getCurrentStock(
    secondProduct.id,
  );

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

  const impossibleSecondQuantity =
    secondStockBefore + 1;

  let saleRejected = false;

  try {
    await recordSale({
      recordedBy: user.id,
      paymentMethod: PaymentMethod.CASH,

      items: [
        {
          productId: firstProduct.id,
          quantity: 1,
        },
        {
          productId: secondProduct.id,
          quantity: impossibleSecondQuantity,
        },
      ],
    });
  } catch (error) {
    if (error instanceof SaleValidationError) {
      saleRejected = true;

      console.log(
        "Expected insufficient-stock rejection occurred:",
      );
      console.log(error.message);
    } else {
      throw error;
    }
  }

  if (!saleRejected) {
    throw new Error(
      "Expected insufficient-stock sale to fail, but it succeeded.",
    );
  }

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

  const firstStockAfter = await getCurrentStock(
    firstProduct.id,
  );

  const secondStockAfter = await getCurrentStock(
    secondProduct.id,
  );

  console.log(
    "Insufficient-stock rollback verification:",
  );

  console.log({
    saleCountBefore,
    saleCountAfter,
    saleItemCountBefore,
    saleItemCountAfter,
    saleMovementCountBefore,
    saleMovementCountAfter,

    firstProduct: {
      productId: firstProduct.id,
      stockBefore: firstStockBefore,
      stockAfter: firstStockAfter,
    },

    secondProduct: {
      productId: secondProduct.id,
      stockBefore: secondStockBefore,
      requestedQuantity:
        impossibleSecondQuantity,
      stockAfter: secondStockAfter,
    },
  });

  if (
    saleCountAfter !== saleCountBefore ||
    saleItemCountAfter !==
      saleItemCountBefore ||
    saleMovementCountAfter !==
      saleMovementCountBefore ||
    firstStockAfter !== firstStockBefore ||
    secondStockAfter !== secondStockBefore
  ) {
    throw new Error(
      "Insufficient-stock rollback verification failed: database state changed.",
    );
  }

  console.log(
    "Insufficient-stock rollback verification passed.",
  );
}

async function main(): Promise<void> {
  await verifySuccessfulSale();
  await verifyInsufficientStockRollback();
}

main()
  .catch((error: unknown) => {
    console.error(
      "Sale verification failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });