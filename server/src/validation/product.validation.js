import * as z from "zod";
export const productIdParamsSchema = z.object({
    id: z
        .string()
        .regex(/^[1-9]\d*$/)
        .transform(Number)
        .refine(Number.isSafeInteger),
});
//# sourceMappingURL=product.validation.js.map