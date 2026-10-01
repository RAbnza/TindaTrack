import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { UserRole } from "../../generated/prisma/client.js";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/rbac.middleware.js";
import {
  recordStockAdjustment,
  StockAdjustmentValidationError,
} from "../services/stock-adjustment.service.js";
import { createStockAdjustmentSchema } from "../validation/stock-adjustment.validation.js";

export const stockAdjustmentRouter =
  Router();

stockAdjustmentRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.OWNER),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedBody =
      createStockAdjustmentSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid stock adjustment request.",
        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    if (!req.auth) {
      res.status(401).json({
        error: "Authentication required.",
      });

      return;
    }

    try {
      const adjustment =
        await recordStockAdjustment({
          productId:
            parsedBody.data.productId,

          quantityDelta:
            parsedBody.data.quantityDelta,

          reason:
            parsedBody.data.reason,

          adjustedBy:
            req.auth.id,
        });

      res.status(201).json({
        id: adjustment.id,
        productId:
          adjustment.productId,
        quantityDelta:
          adjustment.quantityDelta,
        reason:
          adjustment.reason,
        adjustedBy:
          adjustment.adjustedBy,
        createdAt:
          adjustment.createdAt,
      });
    } catch (error) {
      if (
        error instanceof
        StockAdjustmentValidationError
      ) {
        res.status(400).json({
          error: error.message,
        });

        return;
      }

      next(error);
    }
  },
);