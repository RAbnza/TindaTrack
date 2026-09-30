export type RecordStockAdjustmentInput = {
    productId: number;
    quantityDelta: number;
    reason: string;
    adjustedBy: number;
};
export declare class StockAdjustmentValidationError extends Error {
    constructor(message: string);
}
export declare function recordStockAdjustment(input: RecordStockAdjustmentInput): Promise<{
    id: number;
    createdAt: Date;
    productId: number;
    quantityDelta: number;
    reason: string;
    adjustedBy: number;
}>;
//# sourceMappingURL=stock-adjustment.service.d.ts.map