export type RecordStockReceiptInput = {
    supplierId: number;
    receivedBy: number;
    referenceNo?: string | null;
    items: Array<{
        productId: number;
        quantity: number;
        unitCost: string;
    }>;
};
export declare class StockReceiptValidationError extends Error {
    constructor(message: string);
}
export declare function recordStockReceipt(input: RecordStockReceiptInput): Promise<{
    id: number;
    referenceNo: string | null;
    receivedAt: Date;
    supplierId: number;
    receivedBy: number;
}>;
//# sourceMappingURL=stock-receipt.service.d.ts.map