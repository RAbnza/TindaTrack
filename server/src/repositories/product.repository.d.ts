import { Prisma } from "../../generated/prisma/client.js";
type StockQueryClient = Pick<Prisma.TransactionClient, "product" | "stockMovement">;
export type ProductInventoryItem = {
    id: number;
    sku: string;
    name: string;
    category: string | null;
    sellingPrice: Prisma.Decimal;
    reorderLevel: number;
    active: boolean;
    currentStock: number;
    lowStock: boolean;
};
export declare function findProductById(productId: number): Promise<{
    id: number;
    sku: string;
    name: string;
    category: string | null;
    sellingPrice: import("@prisma/client-runtime-utils").Decimal;
    reorderLevel: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function getCurrentStockWithClient(db: StockQueryClient, productId: number): Promise<number>;
export declare function getCurrentStock(productId: number): Promise<number>;
export declare function listProductsWithStock(): Promise<ProductInventoryItem[]>;
export declare function listLowStockProducts(): Promise<ProductInventoryItem[]>;
export {};
//# sourceMappingURL=product.repository.d.ts.map