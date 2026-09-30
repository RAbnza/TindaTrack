import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  recordStockAdjustment,
  StockAdjustmentValidationError,
} from "../services/stock-adjustment.service.js";
import { createStockAdjustmentSchema } from "../validation/stock-adjustment.validation.js";

export const stockAdjustmentRouter = Router();

stockAdjustmentRouter.post(
  "/",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedBody =
      createStockAdjustmentSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid stock adjustment request.",
        details: parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const adjustment = await recordStockAdjustment(
        parsedBody.data,
      );

      res.status(201).json({
        id: adjustment.id,
        productId: adjustment.productId,
        quantityDelta: adjustment.quantityDelta,
        reason: adjustment.reason,
        adjustedBy: adjustment.adjustedBy,
        createdAt: adjustment.createdAt,
      });
    } catch (error) {
      if (
        error instanceof StockAdjustmentValidationError
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