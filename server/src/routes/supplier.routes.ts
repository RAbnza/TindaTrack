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
  listSuppliers,
} from "../services/supplier.service.js";

export const supplierRouter = Router();

supplierRouter.get(
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
      const suppliers =
        await listSuppliers();

      res.status(200).json(
        suppliers,
      );
    } catch (error) {
      next(error);
    }
  },
);