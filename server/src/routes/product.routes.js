import { Router, } from "express";
import { getProductById, listProducts, ProductNotFoundError, } from "../services/product.service.js";
import { productIdParamsSchema } from "../validation/product.validation.js";
export const productRouter = Router();
productRouter.get("/", async (_req, res, next) => {
    try {
        const products = await listProducts();
        res.status(200).json(products);
    }
    catch (error) {
        next(error);
    }
});
productRouter.get("/:id", async (req, res, next) => {
    const parsedParams = productIdParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
        res.status(400).json({
            error: "Product ID must be a positive integer.",
        });
        return;
    }
    try {
        const product = await getProductById(parsedParams.data.id);
        res.status(200).json(product);
    }
    catch (error) {
        if (error instanceof ProductNotFoundError) {
            res.status(404).json({
                error: error.message,
            });
            return;
        }
        next(error);
    }
});
//# sourceMappingURL=product.routes.js.map