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
  createSupplier,
  listSuppliers,
  listSuppliersForManagement,
  SupplierNotFoundError,
  updateSupplier,
} from "../services/supplier.service.js";

import {
  createSupplierSchema,
  supplierIdParamsSchema,
  updateSupplierSchema,
} from "../validation/supplier.validation.js";

export const supplierRouter =
  Router();

/*
 * Operational supplier list.
 *
 * Active suppliers only.
 * OWNER + STAFF.
 */
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

/*
 * Administrative supplier list.
 *
 * Includes active and inactive.
 * OWNER only.
 */
supplierRouter.get(
  "/manage",
  requireAuth,
  requireRole(
    UserRole.OWNER,
  ),
  async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const suppliers =
        await listSuppliersForManagement();

      res.status(200).json(
        suppliers,
      );
    } catch (error) {
      next(error);
    }
  },
);

supplierRouter.post(
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
      createSupplierSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid supplier request.",

        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const supplier =
        await createSupplier(
          parsedBody.data,
        );

      res
        .status(201)
        .json(supplier);
    } catch (error) {
      next(error);
    }
  },
);

supplierRouter.patch(
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
      supplierIdParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        error:
          "Supplier ID must be a positive integer.",
      });

      return;
    }

    const parsedBody =
      updateSupplierSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid supplier update request.",

        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const supplier =
        await updateSupplier(
          parsedParams.data.id,
          parsedBody.data,
        );

      res.status(200).json(
        supplier,
      );
    } catch (error) {
      if (
        error instanceof
        SupplierNotFoundError
      ) {
        res.status(404).json({
          error:
            error.message,
        });

        return;
      }

      next(error);
    }
  },
);