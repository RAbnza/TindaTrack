import {
  jwtVerify,
} from "jose";
import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { prisma } from "../db/prisma.js";
import { authTokenConfig } from "../services/auth.service.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.header(
    "authorization",
  );

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    res.status(401).json({
      error: "Authentication required.",
    });

    return;
  }

  const token = authorization
    .slice("Bearer ".length)
    .trim();

  if (!token) {
    res.status(401).json({
      error: "Authentication required.",
    });

    return;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      authTokenConfig.getSecret(),
      {
        issuer: authTokenConfig.issuer,
        audience: authTokenConfig.audience,
      },
    );

    if (!payload.sub) {
      res.status(401).json({
        error: "Invalid authentication token.",
      });

      return;
    }

    const userId = Number(payload.sub);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      res.status(401).json({
        error: "Invalid authentication token.",
      });

      return;
    }

    /*
     * Re-read the user instead of trusting token role/account
     * status forever.
     */
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      res.status(401).json({
        error: "Authentication is no longer valid.",
      });

      return;
    }

    req.auth = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch {
    res.status(401).json({
      error: "Invalid or expired authentication token.",
    });
  }
}