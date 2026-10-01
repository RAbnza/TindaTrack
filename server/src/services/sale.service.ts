import {
  PaymentMethod,
  Prisma,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../db/prisma.js";

import {
  createAuditLog,
} from "../repositories/audit-log.repository.js";

import {
  getCurrentStockWithClient,
} from "../repositories/product.repository.js";

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
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "SaleValidationError";
  }
}

const MAX_TRANSACTION_ATTEMPTS =
  3;

function validateItems(
  input: RecordSaleInput,
): void {
  if (
    input.items.length ===
    0
  ) {
    throw new SaleValidationError(
      "A sale must contain at least one item.",
    );
  }

  const seenProductIds =
    new Set<number>();

  for (
    const item of input.items
  ) {
    if (
      seenProductIds.has(
        item.productId,
      )
    ) {
      throw new SaleValidationError(
        `Duplicate productId in sale: ${item.productId}`,
      );
    }

    seenProductIds.add(
      item.productId,
    );

    if (
      !Number.isInteger(
        item.quantity,
      ) ||
      item.quantity <= 0
    ) {
      throw new SaleValidationError(
        `Quantity for product ${item.productId} must be a positive integer.`,
      );
    }
  }
}

function isRetryableTransactionError(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

async function executeSaleTransaction(
  input: RecordSaleInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const user =
        await findSaleUserById(
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

      /*
       * Keep product ordering deterministic.
       *
       * This helps concurrent multi-product
       * transactions interact consistently.
       */
      const orderedItems = [
        ...input.items,
      ].sort(
        (
          a,
          b,
        ) =>
          a.productId -
          b.productId,
      );

      const productIds =
        orderedItems.map(
          (item) =>
            item.productId,
        );

      const products =
        await findSaleProductsByIds(
          tx,
          productIds,
        );

      if (
        products.length !==
        productIds.length
      ) {
        const foundProductIds =
          new Set(
            products.map(
              (product) =>
                product.id,
            ),
          );

        const missingProductIds =
          productIds.filter(
            (productId) =>
              !foundProductIds.has(
                productId,
              ),
          );

        throw new SaleValidationError(
          `Products do not exist: ${missingProductIds.join(", ")}`,
        );
      }

      const inactiveProducts =
        products.filter(
          (product) =>
            !product.active,
        );

      if (
        inactiveProducts.length >
        0
      ) {
        throw new SaleValidationError(
          `Inactive products cannot be sold: ${inactiveProducts
            .map(
              (product) =>
                product.id,
            )
            .join(", ")}`,
        );
      }

      const productsById =
        new Map(
          products.map(
            (product) => [
              product.id,
              product,
            ],
          ),
        );

      /*
       * All money is calculated from
       * server-side Product prices.
       *
       * The client never supplies these.
       */
      const pricedItems =
        orderedItems.map(
          (item) => {
            const product =
              productsById.get(
                item.productId,
              );

            if (!product) {
              throw new SaleValidationError(
                `Product ${item.productId} does not exist.`,
              );
            }

            const unitPrice =
              product.sellingPrice;

            const lineTotal =
              unitPrice.mul(
                item.quantity,
              );

            return {
              productId:
                item.productId,

              productName:
                product.name,

              quantity:
                item.quantity,

              unitPrice,

              lineTotal,
            };
          },
        );

      let totalAmount =
        new Prisma.Decimal(0);

      for (
        const item of
        pricedItems
      ) {
        totalAmount =
          totalAmount.add(
            item.lineTotal,
          );
      }

      /*
       * Stock checks happen inside the
       * same Serializable transaction.
       */
      for (
        const item of
        pricedItems
      ) {
        const currentStock =
          await getCurrentStockWithClient(
            tx,
            item.productId,
          );

        if (
          currentStock <
          item.quantity
        ) {
          throw new SaleValidationError(
            `Insufficient stock for product ${item.productId}. Current stock: ${currentStock}, requested quantity: ${item.quantity}.`,
          );
        }
      }

      const sale =
        await createSale(
          tx,
          {
            recordedBy:
              input.recordedBy,

            paymentMethod:
              input.paymentMethod,

            totalAmount,
          },
        );

      for (
        const item of
        pricedItems
      ) {
        const saleItem =
          await createSaleItem(
            tx,
            {
              saleId:
                sale.id,

              productId:
                item.productId,

              quantity:
                item.quantity,

              unitPrice:
                item.unitPrice,

              lineTotal:
                item.lineTotal,
            },
          );

        await createSaleStockMovement(
          tx,
          {
            productId:
              item.productId,

            quantityDelta:
              -item.quantity,

            saleItemId:
              saleItem.id,

            actorId:
              input.recordedBy,
          },
        );
      }

      /*
       * One Sale creates one audit event.
       *
       * This remains inside the same
       * transaction as the sale, line
       * items and stock movements.
       */
      await createAuditLog(
        tx,
        {
          actorId:
            input.recordedBy,

          action:
            "SALE_CREATED",

          entityType:
            "Sale",

          entityId:
            sale.id,

          metadata: {
            totalAmount:
              sale.totalAmount.toString(),

            paymentMethod:
              sale.paymentMethod,

            itemCount:
              pricedItems.length,
          },
        },
      );

      /*
       * Return authoritative receipt data
       * from values that were used inside
       * the committed transaction.
       */
      return {
        id:
          sale.id,

        recordedBy:
          sale.recordedBy,

        recordedByName:
          user.name,

        paymentMethod:
          sale.paymentMethod,

        totalAmount:
          sale.totalAmount,

        createdAt:
          sale.createdAt,

        items:
          pricedItems,
      };
    },
    {
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,
    },
  );
}

export async function recordSale(
  input: RecordSaleInput,
) {
  validateItems(
    input,
  );

  for (
    let attempt = 1;
    attempt <=
    MAX_TRANSACTION_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await executeSaleTransaction(
        input,
      );
    } catch (error) {
      const shouldRetry =
        isRetryableTransactionError(
          error,
        );

      const attemptsRemain =
        attempt <
        MAX_TRANSACTION_ATTEMPTS;

      if (
        shouldRetry &&
        attemptsRemain
      ) {
        continue;
      }

      throw error;
    }
  }

  /*
   * The loop always returns or throws.
   * This exists only for completeness.
   */
  throw new Error(
    "Sale transaction retry loop exited unexpectedly.",
  );
}