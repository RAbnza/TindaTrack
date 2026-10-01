import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  recordSale,
  SaleValidationError,
} from "../services/sale.service.js";
import { createSaleSchema } from "../validation/sale.validation.js";

export const saleRouter = Router();

saleRouter.post(
  "/",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedBody = createSaleSchema.safeParse(
      req.body,
    );

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid sale request.",
        details: parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const sale = await recordSale(
        parsedBody.data,
      );

      res.status(201).json({
        id: sale.id,
        recordedBy: sale.recordedBy,
        paymentMethod: sale.paymentMethod,
        totalAmount: sale.totalAmount.toString(),
        createdAt: sale.createdAt,
      });
    } catch (error) {
      if (error instanceof SaleValidationError) {
        res.status(400).json({
          error: error.message,
        });

        return;
      }

      next(error);
    }
  },
);