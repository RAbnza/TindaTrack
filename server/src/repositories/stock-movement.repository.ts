import { prisma } from "../db/prisma.js";

export async function listStockMovements() {
  return prisma.stockMovement.findMany({
    select: {
      id: true,
      type: true,
      quantityDelta: true,
      createdAt: true,

      saleItemId: true,
      stockReceiptItemId: true,
      stockAdjustmentId: true,

      product: {
        select: {
          id: true,
          sku: true,
          name: true,
        },
      },

      actor: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },

    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
}