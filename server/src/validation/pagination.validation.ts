import * as z from "zod";
import { dailySalesQuerySchema } from "./report.validation.js";

export const pageFields = {
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
};
const date = dailySalesQuerySchema.shape.date;
export const historyQuerySchema = z
  .object({
    ...pageFields,
    search: z.string().trim().max(100).default(""),
    filter: z
      .enum(["ALL", "SALES", "RECEIPTS", "ADJUSTMENTS", "SALE", "RECEIPT", "ADJUSTMENT"])
      .default("ALL"),
    from: date.optional(),
    to: date.optional(),
  })
  .strict()
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "Start date must not follow end date.",
  });
export const catalogQuerySchema = z
  .object({
    ...pageFields,
    search: z.string().trim().max(100).default(""),
    category: z.string().trim().max(100).default(""),
    sort: z.enum(["name", "sku"]).default("name"),
  })
  .strict();
export const pagedReportQuerySchema = dailySalesQuerySchema.extend(pageFields).strict();
export const selectionQuerySchema = z
  .object({
    ids: z
      .string()
      .regex(/^\d+(,\d+)*$/)
      .transform((value) => value.split(",").map(Number))
      .pipe(z.array(z.number().int().min(1).max(2147483647)).min(1).max(100)),
  })
  .strict();
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
export type PageQuery = { page: number; pageSize: number };

export function pageMeta(total: number, query: PageQuery) {
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  return {
    page: Math.min(query.page, totalPages),
    pageSize: query.pageSize,
    total,
    totalPages,
  };
}
