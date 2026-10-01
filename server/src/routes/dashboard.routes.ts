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
  getDashboard,
} from "../services/dashboard.service.js";

export const dashboardRouter =
  Router();

dashboardRouter.get(
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
    if (!req.auth) {
      res.status(401).json({
        error:
          "Authentication required.",
      });

      return;
    }

    try {
      const dashboard =
        await getDashboard({
          userId:
            req.auth.id,

          role:
            req.auth.role,
        });

      res.status(200).json(
        dashboard,
      );
    } catch (error) {
      next(error);
    }
  },
);