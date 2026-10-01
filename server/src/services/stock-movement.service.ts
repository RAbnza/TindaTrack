import {
  StockMovementType,
} from "../../generated/prisma/client.js";

import { listStockMovements } from "../repositories/stock-movement.repository.js";

function getMovementSource(
  movement: Awaited<
    ReturnType<
      typeof listStockMovements
    >
  >[number],
) {
  switch (movement.type) {
    case StockMovementType.RECEIPT:
      return {
        type: "RECEIPT" as const,
        stockReceiptItemId:
          movement.stockReceiptItemId,
      };

    case StockMovementType.SALE:
      return {
        type: "SALE" as const,
        saleItemId:
          movement.saleItemId,
      };

    case StockMovementType.ADJUSTMENT_IN:
    case StockMovementType.ADJUSTMENT_OUT:
      return {
        type:
          "ADJUSTMENT" as const,

        stockAdjustmentId:
          movement.stockAdjustmentId,
      };
  }
}

export async function getStockMovementHistory() {
  const movements =
    await listStockMovements();

  return movements.map(
    (movement) => ({
      id: movement.id,

      product: {
        id: movement.product.id,
        sku: movement.product.sku,
        name: movement.product.name,
      },

      type: movement.type,

      quantityDelta:
        movement.quantityDelta,

      actor: {
        id: movement.actor.id,
        name: movement.actor.name,
        role: movement.actor.role,
      },

      createdAt:
        movement.createdAt.toISOString(),

      source:
        getMovementSource(movement),
    }),
  );
}