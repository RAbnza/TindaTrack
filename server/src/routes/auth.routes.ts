import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  InactiveUserError,
  InvalidCredentialsError,
  login,
} from "../services/auth.service.js";
import { loginSchema } from "../validation/auth.validation.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedBody = loginSchema.safeParse(
      req.body,
    );

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid login request.",
        details: parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const result = await login(
        parsedBody.data.email,
        parsedBody.data.password,
      );

      res.status(200).json(result);
    } catch (error) {
      if (
        error instanceof InvalidCredentialsError
      ) {
        res.status(401).json({
          error: error.message,
        });

        return;
      }

      if (error instanceof InactiveUserError) {
        res.status(403).json({
          error: error.message,
        });

        return;
      }

      next(error);
    }
  },
);