import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  UserRole,
} from "../../generated/prisma/client.js";

import {
  requireAuth,
} from "../auth/auth.middleware.js";

import {
  requireRole,
} from "../auth/rbac.middleware.js";

import {
  createProduct,
  getProductById,
  listProducts,
  ProductNotFoundError,
  ProductSkuConflictError,
  updateProduct,
} from "../services/product.service.js";

import {
  createProductSchema,
  productIdParamsSchema,
  updateProductSchema,
} from "../validation/product.validation.js";

export const productRouter =
  Router();

/*
 * Operational read model.
 *
 * OWNER and STAFF may see products
 * and their ledger-derived stock.
 */
productRouter.get(
  "/",
  requireAuth,
  requireRole(
    UserRole.OWNER,
    UserRole.STAFF,
  ),
  async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const products =
        await listProducts();

      res.status(200).json(
        products,
      );
    } catch (error) {
      next(error);
    }
  },
);

/*
 * Product master-data creation.
 *
 * OWNER only.
 */
productRouter.post(
  "/",
  requireAuth,
  requireRole(
    UserRole.OWNER,
  ),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedBody =
      createProductSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid product request.",

        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const product =
        await createProduct(
          parsedBody.data,
        );

      res
        .status(201)
        .json(product);
    } catch (error) {
      if (
        error instanceof
        ProductSkuConflictError
      ) {
        res.status(409).json({
          error: error.message,
        });

        return;
      }

      next(error);
    }
  },
);

productRouter.get(
  "/:id",
  requireAuth,
  requireRole(
    UserRole.OWNER,
    UserRole.STAFF,
  ),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedParams =
      productIdParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        error:
          "Product ID must be a positive integer.",
      });

      return;
    }

    try {
      const product =
        await getProductById(
          parsedParams.data.id,
        );

      res.status(200).json(
        product,
      );
    } catch (error) {
      if (
        error instanceof
        ProductNotFoundError
      ) {
        res.status(404).json({
          error: error.message,
        });

        return;
      }

      next(error);
    }
  },
);

/*
 * Partial master-data update.
 *
 * OWNER only.
 */
productRouter.patch(
  "/:id",
  requireAuth,
  requireRole(
    UserRole.OWNER,
  ),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedParams =
      productIdParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        error:
          "Product ID must be a positive integer.",
      });

      return;
    }

    const parsedBody =
      updateProductSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid product update request.",

        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const product =
        await updateProduct(
          parsedParams.data.id,
          parsedBody.data,
        );

      res.status(200).json(
        product,
      );
    } catch (error) {
      if (
        error instanceof
        ProductNotFoundError
      ) {
        res.status(404).json({
          error: error.message,
        });

        return;
      }

      if (
        error instanceof
        ProductSkuConflictError
      ) {
        res.status(409).json({
          error: error.message,
        });

        return;
      }

      next(error);
    }
  },
);