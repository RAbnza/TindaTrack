import * as z from "zod";

import { PaymentMethod } from "../../generated/prisma/client.js";

const saleItemSchema = z
  .object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })
  .strict();

export const createSaleSchema = z
  .object({
    paymentMethod: z.enum([
      PaymentMethod.CASH,
      PaymentMethod.GCASH,
      PaymentMethod.MAYA,
    ]),

    items: z
      .array(saleItemSchema)
      .min(1, "A sale must contain at least one item."),
  })
  .strict()
  .superRefine((data, ctx) => {
    const seenProductIds = new Set<number>();

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

export type CreateSaleBody = z.infer<
  typeof createSaleSchema
>;