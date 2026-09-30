import * as z from "zod";

export const createStockAdjustmentSchema = z.object({
  productId: z.number().int().positive(),

  quantityDelta: z
    .number()
    .int()
    .refine((value) => value !== 0, {
      message: "quantityDelta must not be 0.",
    }),

  reason: z
    .string()
    .trim()
    .min(1, "reason must not be empty."),

  adjustedBy: z.number().int().positive(),
});

export type CreateStockAdjustmentBody = z.infer<
  typeof createStockAdjustmentSchema
>;