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
  recordStockReceipt,
  StockReceiptValidationError,
} from "../services/stock-receipt.service.js";
import { createStockReceiptSchema } from "../validation/stock-receipt.validation.js";

export const stockReceiptRouter = Router();

stockReceiptRouter.post(
  "/",
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
    const parsedBody =
      createStockReceiptSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid stock receipt request.",
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
      const receipt =
        await recordStockReceipt({
          supplierId:
            parsedBody.data.supplierId,

          receivedBy:
            req.auth.id,

          referenceNo:
            parsedBody.data.referenceNo ??
            null,

          items:
            parsedBody.data.items,
        });

      res.status(201).json({
        id: receipt.id,
        supplierId:
          receipt.supplierId,
        receivedBy:
          receipt.receivedBy,
        referenceNo:
          receipt.referenceNo,
        receivedAt:
          receipt.receivedAt,
      });
    } catch (error) {
      if (
        error instanceof
        StockReceiptValidationError
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