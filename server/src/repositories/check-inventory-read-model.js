import { prisma } from "../db/prisma.js";
import { listLowStockProducts, listProductsWithStock, } from "./product.repository.js";
async function main() {
    const products = await listProductsWithStock();
    console.log("\nInventory:");
    console.table(products.map((product) => ({
        SKU: product.sku,
        PRODUCT: product.name,
        STOCK: product.currentStock,
        REORDER: product.reorderLevel,
        LOW: product.lowStock,
    })));
    const lowStockProducts = await listLowStockProducts();
    console.log("\nLow-stock products:");
    console.table(lowStockProducts.map((product) => ({
        SKU: product.sku,
        PRODUCT: product.name,
        STOCK: product.currentStock,
        REORDER: product.reorderLevel,
    })));
    verifyReadModel(products);
    console.log("\nInventory read-model verification passed.");
}
function verifyReadModel(products) {
    for (const product of products) {
        const expectedLowStock = product.currentStock <= product.reorderLevel;
        if (product.lowStock !== expectedLowStock) {
            throw new Error(`Low-stock calculation incorrect for product ${product.id}.`);
        }
        if (!Number.isInteger(product.currentStock)) {
            throw new Error(`Current stock for product ${product.id} is not an integer.`);
        }
    }
}
main()
    .catch((error) => {
    console.error("Inventory read-model verification failed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=check-inventory-read-model.js.map