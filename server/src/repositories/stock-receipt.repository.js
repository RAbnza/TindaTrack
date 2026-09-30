import { Prisma, StockMovementType, } from "../../generated/prisma/client.js";
export function findSupplierById(db, supplierId) {
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
export function findReceivingUserById(db, userId) {
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
export function findProductsByIds(db, productIds) {
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
export function createStockReceipt(db, input) {
    return db.stockReceipt.create({
        data: {
            supplierId: input.supplierId,
            receivedBy: input.receivedBy,
            referenceNo: input.referenceNo,
        },
    });
}
export function createStockReceiptItem(db, input) {
    return db.stockReceiptItem.create({
        data: {
            receiptId: input.receiptId,
            productId: input.productId,
            quantity: input.quantity,
            unitCost: input.unitCost,
        },
    });
}
export function createReceiptStockMovement(db, input) {
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
//# sourceMappingURL=stock-receipt.repository.js.map