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
  createStaff,
  listStaff,
  StaffEmailConflictError,
  StaffNotFoundError,
  updateStaff,
} from "../services/staff.service.js";

import {
  createStaffSchema,
  staffIdParamsSchema,
  updateStaffSchema,
} from "../validation/staff.validation.js";

export const staffRouter =
  Router();

staffRouter.get(
  "/",
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
      const staff =
        await listStaff();

      res.status(200).json(
        staff,
      );
    } catch (error) {
      next(error);
    }
  },
);

staffRouter.post(
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
      createStaffSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid staff request.",

        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const staff =
        await createStaff(
          parsedBody.data,
        );

      res
        .status(201)
        .json(staff);
    } catch (error) {
      if (
        error instanceof
        StaffEmailConflictError
      ) {
        res.status(409).json({
          error: error.message,
        });

        return;
      }

      next(error);
    }
  },
);

staffRouter.patch(
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
      staffIdParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        error:
          "Staff ID must be a positive integer.",
      });

      return;
    }

    const parsedBody =
      updateStaffSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid staff update request.",

        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const staff =
        await updateStaff(
          parsedParams.data.id,
          parsedBody.data,
        );

      res.status(200).json(
        staff,
      );
    } catch (error) {
      if (
        error instanceof
        StaffNotFoundError
      ) {
        res.status(404).json({
          error: error.message,
        });

        return;
      }

      if (
        error instanceof
        StaffEmailConflictError
      ) {
        res.status(409).json({
          error: error.message,
        });

        return;
      }

      next(error);
    }
  },
);