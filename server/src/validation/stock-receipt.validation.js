import * as z from "zod";
const decimalStringSchema = z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "unitCost must be a non-negative decimal string with at most 2 decimal places.");
const stockReceiptItemSchema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    unitCost: decimalStringSchema,
});
export const createStockReceiptSchema = z
    .object({
    supplierId: z.number().int().positive(),
    receivedBy: z.number().int().positive(),
    referenceNo: z
        .string()
        .trim()
        .min(1, "referenceNo must not be empty.")
        .nullable()
        .optional(),
    items: z
        .array(stockReceiptItemSchema)
        .min(1, "A stock receipt must contain at least one item."),
})
    .superRefine((data, ctx) => {
    const seenProductIds = new Set();
    data.items.forEach((item, index) => {
        if (seenProductIds.has(item.productId)) {
            ctx.addIssue({
                code: "custom",
                path: ["items", index, "productId"],
                message: `Duplicate productId: ${item.productId}.`,
            });
        }
        seenProductIds.add(item.productId);
    });
});
//# sourceMappingURL=stock-receipt.validation.js.map