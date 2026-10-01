import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { UserRole } from "../../generated/prisma/client.js";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/rbac.middleware.js";
import { getDailySalesReport } from "../services/report.service.js";
import { dailySalesQuerySchema } from "../validation/report.validation.js";

export const reportRouter = Router();

reportRouter.get(
  "/daily-sales",
  requireAuth,
  requireRole(UserRole.OWNER),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedQuery =
      dailySalesQuerySchema.safeParse(
        req.query,
      );

    if (!parsedQuery.success) {
      res.status(400).json({
        error:
          "Invalid daily sales report request.",
        details:
          parsedQuery.error.flatten(),
      });

      return;
    }

    try {
      const report =
        await getDailySalesReport(
          parsedQuery.data.date,
        );

      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  },
);