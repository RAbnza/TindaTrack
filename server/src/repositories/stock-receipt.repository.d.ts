import { Prisma, StockMovementType } from "../../generated/prisma/client.js";
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
export declare function findSupplierById(db: DbClient, supplierId: number): Prisma.Prisma__SupplierClient<{
    id: number;
    active: boolean;
} | null, null, import("@prisma/client/runtime/client").DefaultArgs, {
    omit: Prisma.GlobalOmitConfig | undefined;
}>;
export declare function findReceivingUserById(db: DbClient, userId: number): Prisma.Prisma__UserClient<{
    id: number;
    active: boolean;
} | null, null, import("@prisma/client/runtime/client").DefaultArgs, {
    omit: Prisma.GlobalOmitConfig | undefined;
}>;
export declare function findProductsByIds(db: DbClient, productIds: number[]): Prisma.PrismaPromise<{
    id: number;
    active: boolean;
}[]>;
export declare function createStockReceipt(db: DbClient, input: CreateStockReceiptInput): Prisma.Prisma__StockReceiptClient<{
    id: number;
    referenceNo: string | null;
    receivedAt: Date;
    supplierId: number;
    receivedBy: number;
}, never, import("@prisma/client/runtime/client").DefaultArgs, {
    omit: Prisma.GlobalOmitConfig | undefined;
}>;
export declare function createStockReceiptItem(db: DbClient, input: CreateStockReceiptItemInput): Prisma.Prisma__StockReceiptItemClient<{
    id: number;
    productId: number;
    quantity: number;
    unitCost: import("@prisma/client-runtime-utils").Decimal;
    receiptId: number;
}, never, import("@prisma/client/runtime/client").DefaultArgs, {
    omit: Prisma.GlobalOmitConfig | undefined;
}>;
export declare function createReceiptStockMovement(db: DbClient, input: CreateReceiptMovementInput): Prisma.Prisma__StockMovementClient<{
    id: number;
    createdAt: Date;
    productId: number;
    quantityDelta: number;
    saleItemId: number | null;
    stockReceiptItemId: number | null;
    stockAdjustmentId: number | null;
    actorId: number;
    type: StockMovementType;
}, never, import("@prisma/client/runtime/client").DefaultArgs, {
    omit: Prisma.GlobalOmitConfig | undefined;
}>;
export {};
//# sourceMappingURL=stock-receipt.repository.d.ts.map