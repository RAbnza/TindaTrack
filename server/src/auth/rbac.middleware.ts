import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type {
  UserRole,
} from "../../generated/prisma/client.js";

export function requireRole(
  ...allowedRoles: UserRole[]
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.auth) {
      res.status(401).json({
        error: "Authentication required.",
      });

      return;
    }

    if (
      !allowedRoles.includes(req.auth.role)
    ) {
      res.status(403).json({
        error: "You do not have permission to perform this action.",
      });

      return;
    }

    next();
  };
}