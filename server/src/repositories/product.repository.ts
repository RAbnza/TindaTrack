import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../db/prisma.js";

type StockQueryClient = Pick<
  Prisma.TransactionClient,
  "product" | "stockMovement"
>;

export async function findProductById(productId: number) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
}

export async function getCurrentStockWithClient(
  db: StockQueryClient,
  productId: number,
): Promise<number> {
  const result = await db.stockMovement.aggregate({
    where: {
      productId,
    },
    _sum: {
      quantityDelta: true,
    },
  });

  return result._sum.quantityDelta ?? 0;
}

export async function getCurrentStock(
  productId: number,
): Promise<number> {
  return getCurrentStockWithClient(prisma, productId);
}