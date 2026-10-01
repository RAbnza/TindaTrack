import express, {
  type ErrorRequestHandler,
} from "express";

import { productRouter } from "./routes/product.routes.js";
import { saleRouter } from "./routes/sale.routes.js";
import { stockAdjustmentRouter } from "./routes/stock-adjustment.routes.js";
import { stockReceiptRouter } from "./routes/stock-receipt.routes.js";

export const app = express();

app.use(express.json());

app.use("/api/products", productRouter);
app.use("/api/stock-receipts", stockReceiptRouter);
app.use("/api/adjustments", stockAdjustmentRouter);
app.use("/api/sales", saleRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  console.error(error);

  res.status(500).json({
    error: "Internal server error.",
  });
};

app.use(errorHandler);