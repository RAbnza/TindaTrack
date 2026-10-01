import * as z from "zod";

const sellingPriceSchema = z
  .string()
  .trim()
  .regex(
    /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/,
    "sellingPrice must be a valid decimal string with at most 2 decimal places.",
  )
  .refine(
    (value) =>
      Number(value) > 0,
    {
      message:
        "sellingPrice must be greater than 0.",
    },
  );

const categorySchema = z
  .string()
  .trim()
  .min(
    1,
    "category must not be empty.",
  )
  .nullable();

export const productIdParamsSchema =
  z.object({
    id: z
      .string()
      .regex(/^[1-9]\d*$/)
      .transform(Number)
      .refine(
        Number.isSafeInteger,
      ),
  });

export const createProductSchema =
  z
    .object({
      sku: z
        .string()
        .trim()
        .min(
          1,
          "sku must not be empty.",
        ),

      name: z
        .string()
        .trim()
        .min(
          1,
          "name must not be empty.",
        ),

      category:
        categorySchema.optional(),

      sellingPrice:
        sellingPriceSchema,

      reorderLevel: z
        .number()
        .int()
        .min(
          0,
          "reorderLevel must be greater than or equal to 0.",
        ),
    })
    .strict();

export const updateProductSchema =
  z
    .object({
      sku: z
        .string()
        .trim()
        .min(
          1,
          "sku must not be empty.",
        )
        .optional(),

      name: z
        .string()
        .trim()
        .min(
          1,
          "name must not be empty.",
        )
        .optional(),

      category:
        categorySchema.optional(),

      sellingPrice:
        sellingPriceSchema.optional(),

      reorderLevel: z
        .number()
        .int()
        .min(
          0,
          "reorderLevel must be greater than or equal to 0.",
        )
        .optional(),

      active:
        z.boolean().optional(),
    })
    .strict()
    .refine(
      (data) =>
        Object.keys(data)
          .length > 0,
      {
        message:
          "At least one product field must be provided.",
      },
    );

export type CreateProductBody =
  z.infer<
    typeof createProductSchema
  >;

export type UpdateProductBody =
  z.infer<
    typeof updateProductSchema
  >;