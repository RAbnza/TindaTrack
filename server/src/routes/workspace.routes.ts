import { Router, type RequestHandler } from "express";
import { UserRole } from "../../generated/prisma/client.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/rbac.middleware.js";
import {
  browseProducts,
  browseAudit,
  browseMovements,
  browseDailySales,
  readProductSelection,
} from "../repositories/workspace.repository.js";
import {
  catalogQuerySchema,
  historyQuerySchema,
  pagedReportQuerySchema,
  selectionQuerySchema,
} from "../validation/pagination.validation.js";
import type { ZodType } from "zod";

export const workspaceRouter = Router();
function pagedHandler<T>(
  schema: ZodType<T>,
  read: (query: T) => Promise<unknown>,
): RequestHandler {
  return async (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error: "Invalid pagination or filters.",
          details: parsed.error.flatten(),
        });
      return;
    }
    try {
      res.json(await read(parsed.data));
    } catch (error) {
      next(error);
    }
  };
}
// Additive endpoints preserve existing array/report contracts for other consumers.
workspaceRouter.get(
  "/products/browse",
  requireAuth,
  requireRole(UserRole.OWNER, UserRole.STAFF),
  pagedHandler(catalogQuerySchema, browseProducts),
);
workspaceRouter.get(
  "/products/selection",
  requireAuth,
  requireRole(UserRole.OWNER, UserRole.STAFF),
  pagedHandler(selectionQuerySchema, (q) => readProductSelection(q.ids)),
);
workspaceRouter.get(
  "/audit-logs/browse",
  requireAuth,
  requireRole(UserRole.OWNER),
  pagedHandler(
    historyQuerySchema.refine((q) =>
      ["ALL", "SALES", "RECEIPTS", "ADJUSTMENTS"].includes(q.filter),
    ),
    browseAudit,
  ),
);
workspaceRouter.get(
  "/stock-movements/browse",
  requireAuth,
  requireRole(UserRole.OWNER),
  pagedHandler(
    historyQuerySchema.refine((q) =>
      ["ALL", "SALE", "RECEIPT", "ADJUSTMENT"].includes(q.filter),
    ),
    browseMovements,
  ),
);
workspaceRouter.get(
  "/reports/daily-sales/browse",
  requireAuth,
  requireRole(UserRole.OWNER),
  pagedHandler(pagedReportQuerySchema, (q) => browseDailySales(q.date, q)),
);
