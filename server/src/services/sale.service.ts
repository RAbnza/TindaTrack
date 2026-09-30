import {
  PaymentMethod,
  Prisma,
} from "../../generated/prisma/client.js";

import { prisma } from "../db/prisma.js";
import { getCurrentStockWithClient } from "../repositories/product.repository.js";
import {
  createSale,
  createSaleItem,
  createSaleStockMovement,
  findSaleProductsByIds,
  findSaleUserById,
} from "../repositories/sale.repository.js";

export type RecordSaleInput = {
  recordedBy: number;
  paymentMethod: PaymentMethod;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
};

export class SaleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaleValidationError";
  }
}

function validateItems(input: RecordSaleInput): void {
  if (input.items.length === 0) {
    throw new SaleValidationError(
      "A sale must contain at least one item.",
    );
  }

  const seenProductIds = new Set<number>();

  for (const item of input.items) {
    if (seenProductIds.has(item.productId)) {
      throw new SaleValidationError(
        `Duplicate productId in sale: ${item.productId}`,
      );
    }

    seenProductIds.add(item.productId);

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new SaleValidationError(
        `Quantity for product ${item.productId} must be a positive integer.`,
      );
    }
  }
}

export async function recordSale(
  input: RecordSaleInput,
) {
  validateItems(input);

  return prisma.$transaction(async (tx) => {
    const user = await findSaleUserById(
      tx,
      input.recordedBy,
    );

    if (!user) {
      throw new SaleValidationError(
        `User ${input.recordedBy} does not exist.`,
      );
    }

    if (!user.active) {
      throw new SaleValidationError(
        `User ${input.recordedBy} is inactive.`,
      );
    }

    const productIds = input.items.map(
      (item) => item.productId,
    );

    const products = await findSaleProductsByIds(
      tx,
      productIds,
    );

    if (products.length !== productIds.length) {
      const foundProductIds = new Set(
        products.map((product) => product.id),
      );

      const missingProductIds = productIds.filter(
        (productId) => !foundProductIds.has(productId),
      );

      throw new SaleValidationError(
        `Products do not exist: ${missingProductIds.join(", ")}`,
      );
    }

    const inactiveProducts = products.filter(
      (product) => !product.active,
    );

    if (inactiveProducts.length > 0) {
      throw new SaleValidationError(
        `Inactive products cannot be sold: ${inactiveProducts
          .map((product) => product.id)
          .join(", ")}`,
      );
    }

    const productsById = new Map(
      products.map((product) => [
        product.id,
        product,
      ]),
    );

    const pricedItems = input.items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new SaleValidationError(
          `Product ${item.productId} does not exist.`,
        );
      }

      const unitPrice = product.sellingPrice;

      const lineTotal = unitPrice.mul(
        item.quantity,
      );

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    let totalAmount = new Prisma.Decimal(0);

    for (const item of pricedItems) {
      totalAmount = totalAmount.add(
        item.lineTotal,
      );
    }

    for (const item of pricedItems) {
      const currentStock =
        await getCurrentStockWithClient(
          tx,
          item.productId,
        );

      if (currentStock < item.quantity) {
        throw new SaleValidationError(
          `Insufficient stock for product ${item.productId}. Current stock: ${currentStock}, requested quantity: ${item.quantity}.`,
        );
      }
    }

    const sale = await createSale(tx, {
      recordedBy: input.recordedBy,
      paymentMethod: input.paymentMethod,
      totalAmount,
    });

    for (const item of pricedItems) {
      const saleItem = await createSaleItem(
        tx,
        {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        },
      );

      await createSaleStockMovement(tx, {
        productId: item.productId,
        quantityDelta: -item.quantity,
        saleItemId: saleItem.id,
        actorId: input.recordedBy,
      });
    }

    return sale;
  });
}