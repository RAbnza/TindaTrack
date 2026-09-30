import { prisma } from "../db/prisma.js";

export async function findProductById(productId: number) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
}

export async function getCurrentStock(productId: number): Promise<number> {
  const result = await prisma.stockMovement.aggregate({
    where: {
      productId,
    },
    _sum: {
      quantityDelta: true,
    },
  });

  return result._sum.quantityDelta ?? 0;
}