import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { UserRole } from "../../generated/prisma/client.js";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/rbac.middleware.js";
import { getStockMovementHistory } from "../services/stock-movement.service.js";

export const stockMovementRouter =
  Router();

stockMovementRouter.get(
  "/",
  requireAuth,
  requireRole(UserRole.OWNER),
  async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const movements =
        await getStockMovementHistory();

      res.status(200).json(
        movements,
      );
    } catch (error) {
      next(error);
    }
  },
);