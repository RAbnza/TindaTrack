import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  createInitialOwner,
  getSetupStatus,
  SetupAlreadyCompletedError,
} from "../services/setup.service.js";

import {
  createInitialOwnerSchema,
} from "../validation/setup.validation.js";

export const setupRouter =
  Router();

setupRouter.get(
  "/status",
  async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const status =
        await getSetupStatus();

      res
        .status(200)
        .json(status);
    } catch (error) {
      next(error);
    }
  },
);

setupRouter.post(
  "/",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const parsedBody =
      createInitialOwnerSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        error:
          "Invalid setup request.",

        details:
          parsedBody.error.flatten(),
      });

      return;
    }

    try {
      const owner =
        await createInitialOwner(
          parsedBody.data,
        );

      /*
       * No JWT is issued here.
       *
       * Setup and authentication remain
       * separate responsibilities.
       */
      res.status(201).json(
        owner,
      );
    } catch (error) {
      if (
        error instanceof
        SetupAlreadyCompletedError
      ) {
        res.status(409).json({
          error:
            error.message,
        });

        return;
      }

      next(error);
    }
  },
);