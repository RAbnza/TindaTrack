export type ProductReadModel = {
    id: number;
    sku: string;
    name: string;
    category: string | null;
    sellingPrice: string;
    reorderLevel: number;
    active: boolean;
    currentStock: number;
    lowStock: boolean;
};
export declare class ProductNotFoundError extends Error {
    constructor(productId: number);
}
export declare function listProducts(): Promise<ProductReadModel[]>;
export declare function getProductById(productId: number): Promise<ProductReadModel>;
//# sourceMappingURL=product.service.d.ts.map