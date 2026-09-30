import { prisma } from "../db/prisma.js";
import { getCurrentStock } from "./product.repository.js";
async function main() {
    const product = await prisma.product.findFirst({
        select: {
            id: true,
            sku: true,
            name: true,
        },
    });
    if (!product) {
        console.log("No Products exist yet.");
        return;
    }
    const currentStock = await getCurrentStock(product.id);
    console.log("Product:", product);
    console.log("Current stock:", currentStock);
}
main()
    .catch((error) => {
    console.error("Product repository check failed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=check-product-repository.js.map