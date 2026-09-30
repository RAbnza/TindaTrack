import {
  PaymentMethod,
  Prisma,
  StockMovementType,
} from "../../generated/prisma/client.js";

type DbClient = Prisma.TransactionClient;

type CreateSaleInput = {
  recordedBy: number;
  paymentMethod: PaymentMethod;
  totalAmount: Prisma.Decimal;
};

type CreateSaleItemInput = {
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
};

type CreateSaleMovementInput = {
  productId: number;
  quantityDelta: number;
  saleItemId: number;
  actorId: number;
};

export function findSaleUserById(
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

export function findSaleProductsByIds(
  db: DbClient,
  productIds: number[],
) {
  return db.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      active: true,
      sellingPrice: true,
    },
  });
}

export function createSale(
  db: DbClient,
  input: CreateSaleInput,
) {
  return db.sale.create({
    data: {
      recordedBy: input.recordedBy,
      paymentMethod: input.paymentMethod,
      totalAmount: input.totalAmount,
    },
  });
}

export function createSaleItem(
  db: DbClient,
  input: CreateSaleItemInput,
) {
  return db.saleItem.create({
    data: {
      saleId: input.saleId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      lineTotal: input.lineTotal,
    },
  });
}

export function createSaleStockMovement(
  db: DbClient,
  input: CreateSaleMovementInput,
) {
  return db.stockMovement.create({
    data: {
      productId: input.productId,
      type: StockMovementType.SALE,
      quantityDelta: input.quantityDelta,
      saleItemId: input.saleItemId,
      actorId: input.actorId,
    },
  });
}