import * as z from "zod";

const contactDetailsSchema = z
  .string()
  .trim()
  .min(
    1,
    "contactDetails must not be empty.",
  )
  .nullable();

export const supplierIdParamsSchema =
  z.object({
    id: z
      .string()
      .regex(/^[1-9]\d*$/)
      .transform(Number)
      .refine(
        Number.isSafeInteger,
      ),
  });

export const createSupplierSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(
          1,
          "name must not be empty.",
        ),

      contactDetails:
        contactDetailsSchema.optional(),
    })
    .strict();

export const updateSupplierSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(
          1,
          "name must not be empty.",
        )
        .optional(),

      contactDetails:
        contactDetailsSchema.optional(),

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
          "At least one supplier field must be provided.",
      },
    );

export type CreateSupplierBody =
  z.infer<
    typeof createSupplierSchema
  >;

export type UpdateSupplierBody =
  z.infer<
    typeof updateSupplierSchema
  >;