import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../db/prisma.js";
import {
  createReceiptStockMovement,
  createStockReceipt,
  createStockReceiptItem,
  findProductsByIds,
  findReceivingUserById,
  findSupplierById,
} from "../repositories/stock-receipt.repository.js";

export type RecordStockReceiptInput = {
  supplierId: number;
  receivedBy: number;
  referenceNo?: string | null;
  items: Array<{
    productId: number;
    quantity: number;
    unitCost: string;
  }>;
};

export class StockReceiptValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockReceiptValidationError";
  }
}

function parseUnitCost(value: string): Prisma.Decimal {
  let unitCost: Prisma.Decimal;

  try {
    unitCost = new Prisma.Decimal(value);
  } catch {
    throw new StockReceiptValidationError(
      `Invalid unit cost: ${value}`,
    );
  }

  if (unitCost.isNegative()) {
    throw new StockReceiptValidationError(
      "Unit cost must be greater than or equal to 0.",
    );
  }

  return unitCost;
}

function validateItems(input: RecordStockReceiptInput): void {
  if (input.items.length === 0) {
    throw new StockReceiptValidationError(
      "A stock receipt must contain at least one item.",
    );
  }

  const seenProductIds = new Set<number>();

  for (const item of input.items) {
    if (seenProductIds.has(item.productId)) {
      throw new StockReceiptValidationError(
        `Duplicate productId in receipt: ${item.productId}`,
      );
    }

    seenProductIds.add(item.productId);

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new StockReceiptValidationError(
        `Quantity for product ${item.productId} must be a positive integer.`,
      );
    }

    parseUnitCost(item.unitCost);
  }
}

export async function recordStockReceipt(
  input: RecordStockReceiptInput,
) {
  validateItems(input);

  const parsedItems = input.items.map((item) => ({
    ...item,
    unitCost: parseUnitCost(item.unitCost),
  }));

  return prisma.$transaction(async (tx) => {
    const supplier = await findSupplierById(
      tx,
      input.supplierId,
    );

    if (!supplier) {
      throw new StockReceiptValidationError(
        `Supplier ${input.supplierId} does not exist.`,
      );
    }

    if (!supplier.active) {
      throw new StockReceiptValidationError(
        `Supplier ${input.supplierId} is inactive.`,
      );
    }

    const user = await findReceivingUserById(
      tx,
      input.receivedBy,
    );

    if (!user) {
      throw new StockReceiptValidationError(
        `User ${input.receivedBy} does not exist.`,
      );
    }

    if (!user.active) {
      throw new StockReceiptValidationError(
        `User ${input.receivedBy} is inactive.`,
      );
    }

    const productIds = parsedItems.map(
      (item) => item.productId,
    );

    const products = await findProductsByIds(
      tx,
      productIds,
    );

    if (products.length !== productIds.length) {
      const foundIds = new Set(
        products.map((product) => product.id),
      );

      const missingProductIds = productIds.filter(
        (productId) => !foundIds.has(productId),
      );

      throw new StockReceiptValidationError(
        `Products do not exist: ${missingProductIds.join(", ")}`,
      );
    }

    const inactiveProducts = products.filter(
      (product) => !product.active,
    );

    if (inactiveProducts.length > 0) {
      throw new StockReceiptValidationError(
        `Inactive products cannot be received: ${inactiveProducts
          .map((product) => product.id)
          .join(", ")}`,
      );
    }

    const receipt = await createStockReceipt(tx, {
      supplierId: input.supplierId,
      receivedBy: input.receivedBy,
      referenceNo: input.referenceNo ?? null,
    });

    for (const item of parsedItems) {
      const receiptItem = await createStockReceiptItem(
        tx,
        {
          receiptId: receipt.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        },
      );

      await createReceiptStockMovement(tx, {
        productId: item.productId,
        quantityDelta: item.quantity,
        stockReceiptItemId: receiptItem.id,
        actorId: input.receivedBy,
      });
    }

    return receipt;
  });
}