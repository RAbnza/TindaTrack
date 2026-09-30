import {
  Prisma,
  StockMovementType,
} from "../../generated/prisma/client.js";

type DbClient = Prisma.TransactionClient;

type CreateStockAdjustmentInput = {
  productId: number;
  quantityDelta: number;
  reason: string;
  adjustedBy: number;
};

type CreateAdjustmentMovementInput = {
  productId: number;
  quantityDelta: number;
  stockAdjustmentId: number;
  actorId: number;
  type: StockMovementType;
};

export function findAdjustmentUserById(
  db: DbClient,
  userId: number,
) {
  return db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      active: true,
    },
  });
}

export function findAdjustmentProductById(
  db: DbClient,
  productId: number,
) {
  return db.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      active: true,
    },
  });
}

export function createStockAdjustment(
  db: DbClient,
  input: CreateStockAdjustmentInput,
) {
  return db.stockAdjustment.create({
    data: {
      productId: input.productId,
      quantityDelta: input.quantityDelta,
      reason: input.reason,
      adjustedBy: input.adjustedBy,
    },
  });
}

export function createAdjustmentStockMovement(
  db: DbClient,
  input: CreateAdjustmentMovementInput,
) {
  return db.stockMovement.create({
    data: {
      productId: input.productId,
      type: input.type,
      quantityDelta: input.quantityDelta,
      stockAdjustmentId: input.stockAdjustmentId,
      actorId: input.actorId,
    },
  });
}