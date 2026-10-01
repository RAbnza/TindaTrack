import * as z from "zod";

const normalizedEmailSchema = z
  .string()
  .trim()
  .email()
  .transform(
    (value) =>
      value.toLowerCase(),
  );

export const staffIdParamsSchema =
  z.object({
    id: z
      .string()
      .regex(/^[1-9]\d*$/)
      .transform(Number)
      .refine(
        Number.isSafeInteger,
      ),
  });

export const createStaffSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(
          1,
          "name must not be empty.",
        ),

      email:
        normalizedEmailSchema,

      password: z
        .string()
        .min(
          8,
          "password must be at least 8 characters.",
        ),
    })
    .strict();

export const updateStaffSchema =
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

      email:
        normalizedEmailSchema.optional(),

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
          "At least one staff field must be provided.",
      },
    );

export type CreateStaffBody =
  z.infer<
    typeof createStaffSchema
  >;

export type UpdateStaffBody =
  z.infer<
    typeof updateStaffSchema
  >;