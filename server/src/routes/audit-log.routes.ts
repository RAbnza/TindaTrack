import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { UserRole } from "../../generated/prisma/client.js";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/rbac.middleware.js";
import { getAuditLogHistory } from "../services/audit-log.service.js";

export const auditLogRouter =
  Router();

auditLogRouter.get(
  "/",
  requireAuth,
  requireRole(UserRole.OWNER),
  async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const logs =
        await getAuditLogHistory();

      res.status(200).json(
        logs,
      );
    } catch (error) {
      next(error);
    }
  },
);