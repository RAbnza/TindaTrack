import cors from "cors";
import { workspaceRouter } from "./routes/workspace.routes.js";

import express, {
  type ErrorRequestHandler,
} from "express";

import {
  env,
} from "./config/env.js";

import {
  authRouter,
} from "./routes/auth.routes.js";

import {
  setupRouter,
} from "./routes/setup.routes.js";

import {
  productRouter,
} from "./routes/product.routes.js";

import {
  supplierRouter,
} from "./routes/supplier.routes.js";

import {
  staffRouter,
} from "./routes/staff.routes.js";

import {
  dashboardRouter,
} from "./routes/dashboard.routes.js";

import {
  saleRouter,
} from "./routes/sale.routes.js";

import {
  stockAdjustmentRouter,
} from "./routes/stock-adjustment.routes.js";

import {
  stockReceiptRouter,
} from "./routes/stock-receipt.routes.js";

import {
  reportRouter,
} from "./routes/report.routes.js";

import {
  stockMovementRouter,
} from "./routes/stock-movement.routes.js";

import {
  auditLogRouter,
} from "./routes/audit-log.routes.js";

export const app =
  express();

app.use(
  cors({
    origin:
      env.CLIENT_ORIGIN,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

app.use(
  express.json(),
);

/*
 * Public health boundary.
 *
 * This confirms that the API process
 * is alive and accepting HTTP requests.
 *
 * It deliberately does not expose
 * database, environment, or credential
 * information.
 */
app.get(
  "/health",
  (_req, res) => {
    res
      .status(200)
      .json({
        status:
          "ok",
      });
  },
);

/*
 * Public bootstrap boundary.
 *
 * Setup is protected by the invariant
 * that no User may already exist.
 */
app.use(
  "/api/setup",
  setupRouter,
);

/*
 * Public authentication boundary.
 */
app.use(
  "/api/auth",
  authRouter,
);

/*
 * Individual routers enforce their
 * authentication and RBAC requirements.
 */
app.use("/api", workspaceRouter);

app.use(
  "/api/products",
  productRouter,
);

app.use(
  "/api/suppliers",
  supplierRouter,
);

app.use(
  "/api/staff",
  staffRouter,
);

app.use(
  "/api/dashboard",
  dashboardRouter,
);

app.use(
  "/api/stock-receipts",
  stockReceiptRouter,
);

app.use(
  "/api/adjustments",
  stockAdjustmentRouter,
);

app.use(
  "/api/sales",
  saleRouter,
);

app.use(
  "/api/reports",
  reportRouter,
);

app.use(
  "/api/stock-movements",
  stockMovementRouter,
);

app.use(
  "/api/audit-logs",
  auditLogRouter,
);

app.use(
  (_req, res) => {
    res
      .status(404)
      .json({
        error:
          "Route not found.",
      });
  },
);

const errorHandler:
  ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
  ) => {
    console.error(
      error,
    );

    res
      .status(500)
      .json({
        error:
          "Internal server error.",
      });
  };

app.use(
  errorHandler,
);
