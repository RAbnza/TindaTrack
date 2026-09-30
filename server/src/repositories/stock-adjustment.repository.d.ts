import { Prisma, StockMovementType } from "../../generated/prisma/client.js";
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
export declare function findAdjustmentUserById(db: DbClient, userId: number): Prisma.Prisma__UserClient<{
    id: number;
    active: boolean;
} | null, null, import("@prisma/client/runtime/client").DefaultArgs, {
    omit: Prisma.GlobalOmitConfig | undefined;
}>;
export declare function findAdjustmentProductById(db: DbClient, productId: number): Prisma.Prisma__ProductClient<{
    id: number;
    active: boolean;
} | null, null, import("@prisma/client/runtime/client").DefaultArgs, {
    omit: Prisma.GlobalOmitConfig | undefined;
}>;
export declare function createStockAdjustment(db: DbClient, input: CreateStockAdjustmentInput): Prisma.Prisma__StockAdjustmentClient<{
    id: number;
    createdAt: Date;
    productId: number;
    quantityDelta: number;
    reason: string;
    adjustedBy: number;
}, never, import("@prisma/client/runtime/client").DefaultArgs, {
    omit: Prisma.GlobalOmitConfig | undefined;
}>;
export declare function createAdjustmentStockMovement(db: DbClient, input: CreateAdjustmentMovementInput): Prisma.Prisma__StockMovementClient<{
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
//# sourceMappingURL=stock-adjustment.repository.d.ts.map