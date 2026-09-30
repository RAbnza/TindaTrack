import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  recordStockReceipt,
  StockReceiptValidationError,
} from "../services/stock-receipt.service.js";
import { createStockReceiptSchema } from "../validation/stock-receipt.validation.js";

export const stockReceiptRouter = Router();

stockReceiptRouter.post(
  "/",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedBody = createStockReceiptSchema.safeParse(
      req.body,
    );

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid stock receipt request.",
        details: parsedBody.error.flatten(),
      });

      return;
    }

    try {
        const receipt = await recordStockReceipt({
            supplierId: parsedBody.data.supplierId,
            receivedBy: parsedBody.data.receivedBy,
            referenceNo: parsedBody.data.referenceNo ?? null,
            items: parsedBody.data.items,
        });

        res.status(201).json({
            id: receipt.id,
            supplierId: receipt.supplierId,
            receivedBy: receipt.receivedBy,
            referenceNo: receipt.referenceNo,
            receivedAt: receipt.receivedAt,
        });
    } catch (error) {
        if (error instanceof StockReceiptValidationError) {
            res.status(400).json({
            error: error.message,
            });

            return;
        }

    next(error);
    }
  },
);