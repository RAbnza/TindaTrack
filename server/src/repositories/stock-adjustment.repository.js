import { Prisma, StockMovementType, } from "../../generated/prisma/client.js";
export function findAdjustmentUserById(db, userId) {
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
export function findAdjustmentProductById(db, productId) {
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
export function createStockAdjustment(db, input) {
    return db.stockAdjustment.create({
        data: {
            productId: input.productId,
            quantityDelta: input.quantityDelta,
            reason: input.reason,
            adjustedBy: input.adjustedBy,
        },
    });
}
export function createAdjustmentStockMovement(db, input) {
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
//# sourceMappingURL=stock-adjustment.repository.js.map