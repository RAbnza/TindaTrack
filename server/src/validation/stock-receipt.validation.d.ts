import * as z from "zod";
export declare const createStockReceiptSchema: z.ZodObject<{
    supplierId: z.ZodNumber;
    receivedBy: z.ZodNumber;
    referenceNo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodNumber;
        quantity: z.ZodNumber;
        unitCost: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateStockReceiptBody = z.infer<typeof createStockReceiptSchema>;
//# sourceMappingURL=stock-receipt.validation.d.ts.map