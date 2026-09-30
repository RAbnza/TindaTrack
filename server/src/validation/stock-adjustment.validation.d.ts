import * as z from "zod";
export declare const createStockAdjustmentSchema: z.ZodObject<{
    productId: z.ZodNumber;
    quantityDelta: z.ZodNumber;
    reason: z.ZodString;
    adjustedBy: z.ZodNumber;
}, z.core.$strip>;
export type CreateStockAdjustmentBody = z.infer<typeof createStockAdjustmentSchema>;
//# sourceMappingURL=stock-adjustment.validation.d.ts.map