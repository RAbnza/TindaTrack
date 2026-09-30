import { StockMovementType } from "../../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { getCurrentStockWithClient } from "../repositories/product.repository.js";
import { createAdjustmentStockMovement, createStockAdjustment, findAdjustmentProductById, findAdjustmentUserById, } from "../repositories/stock-adjustment.repository.js";
export class StockAdjustmentValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "StockAdjustmentValidationError";
    }
}
function validateInput(input) {
    if (!Number.isInteger(input.quantityDelta) ||
        input.quantityDelta === 0) {
        throw new StockAdjustmentValidationError("quantityDelta must be a non-zero integer.");
    }
    const reason = input.reason.trim();
    if (reason.length === 0) {
        throw new StockAdjustmentValidationError("Adjustment reason must not be empty.");
    }
    return reason;
}
export async function recordStockAdjustment(input) {
    const reason = validateInput(input);
    return prisma.$transaction(async (tx) => {
        const user = await findAdjustmentUserById(tx, input.adjustedBy);
        if (!user) {
            throw new StockAdjustmentValidationError(`User ${input.adjustedBy} does not exist.`);
        }
        if (!user.active) {
            throw new StockAdjustmentValidationError(`User ${input.adjustedBy} is inactive.`);
        }
        const product = await findAdjustmentProductById(tx, input.productId);
        if (!product) {
            throw new StockAdjustmentValidationError(`Product ${input.productId} does not exist.`);
        }
        if (!product.active) {
            throw new StockAdjustmentValidationError(`Product ${input.productId} is inactive.`);
        }
        if (input.quantityDelta < 0) {
            const currentStock = await getCurrentStockWithClient(tx, input.productId);
            const resultingStock = currentStock + input.quantityDelta;
            if (resultingStock < 0) {
                throw new StockAdjustmentValidationError(`Adjustment would make inventory negative. Current stock: ${currentStock}, quantityDelta: ${input.quantityDelta}.`);
            }
        }
        const adjustment = await createStockAdjustment(tx, {
            productId: input.productId,
            quantityDelta: input.quantityDelta,
            reason,
            adjustedBy: input.adjustedBy,
        });
        const movementType = input.quantityDelta > 0
            ? StockMovementType.ADJUSTMENT_IN
            : StockMovementType.ADJUSTMENT_OUT;
        await createAdjustmentStockMovement(tx, {
            productId: adjustment.productId,
            quantityDelta: adjustment.quantityDelta,
            stockAdjustmentId: adjustment.id,
            actorId: input.adjustedBy,
            type: movementType,
        });
        return adjustment;
    });
}
//# sourceMappingURL=stock-adjustment.service.js.map