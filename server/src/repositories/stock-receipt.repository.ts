import {
  Prisma,
  StockMovementType,
} from "../../generated/prisma/client.js";

type DbClient = Prisma.TransactionClient;

type CreateStockReceiptInput = {
  supplierId: number;
  receivedBy: number;
  referenceNo: string | null;
};

type CreateStockReceiptItemInput = {
  receiptId: number;
  productId: number;
  quantity: number;
  unitCost: Prisma.Decimal;
};

type CreateReceiptMovementInput = {
  productId: number;
  quantityDelta: number;
  stockReceiptItemId: number;
  actorId: number;
};

export function findSupplierById(
  db: DbClient,
  supplierId: number,
) {
  return db.supplier.findUnique({
    where: {
      id: supplierId,
    },
    select: {
      id: true,
      active: true,
    },
  });
}

export function findReceivingUserById(
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

export function findProductsByIds(
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
    },
  });
}

export function createStockReceipt(
  db: DbClient,
  input: CreateStockReceiptInput,
) {
  return db.stockReceipt.create({
    data: {
      supplierId: input.supplierId,
      receivedBy: input.receivedBy,
      referenceNo: input.referenceNo,
    },
  });
}

export function createStockReceiptItem(
  db: DbClient,
  input: CreateStockReceiptItemInput,
) {
  return db.stockReceiptItem.create({
    data: {
      receiptId: input.receiptId,
      productId: input.productId,
      quantity: input.quantity,
      unitCost: input.unitCost,
    },
  });
}

export function createReceiptStockMovement(
  db: DbClient,
  input: CreateReceiptMovementInput,
) {
  return db.stockMovement.create({
    data: {
      productId: input.productId,
      type: StockMovementType.RECEIPT,
      quantityDelta: input.quantityDelta,
      stockReceiptItemId: input.stockReceiptItemId,
      actorId: input.actorId,
    },
  });
}