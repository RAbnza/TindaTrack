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
  recordSale,
  SaleValidationError,
} from "../services/sale.service.js";

import {
  createSaleSchema,
} from "../validation/sale.validation.js";

export const saleRouter =
  Router();

saleRouter.post(
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
      createSaleSchema.safeParse(
        req.body,
      );

    if (
      !parsedBody.success
    ) {
      res.status(400).json({
        error:
          "Invalid sale request.",

        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    if (!req.auth) {
      res.status(401).json({
        error:
          "Authentication required.",
      });

      return;
    }

    try {
      const sale =
        await recordSale({
          recordedBy:
            req.auth.id,

          paymentMethod:
            parsedBody.data
              .paymentMethod,

          items:
            parsedBody.data.items,
        });

      res.status(201).json({
        id:
          sale.id,

        recordedBy:
          sale.recordedBy,

        recordedByName:
          sale.recordedByName,

        paymentMethod:
          sale.paymentMethod,

        totalAmount:
          sale.totalAmount.toString(),

        createdAt:
          sale.createdAt,

        items:
          sale.items.map(
            (item) => ({
              productId:
                item.productId,

              productName:
                item.productName,

              quantity:
                item.quantity,

              unitPrice:
                item.unitPrice.toString(),

              lineTotal:
                item.lineTotal.toString(),
            }),
          ),
      });
    } catch (error) {
      if (
        error instanceof
        SaleValidationError
      ) {
        res.status(400).json({
          error:
            error.message,
        });

        return;
      }

      next(error);
    }
  },
);