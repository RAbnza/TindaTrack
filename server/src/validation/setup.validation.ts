import * as z from "zod";

export const createInitialOwnerSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(
          1,
          "name must not be empty.",
        ),

      email: z
        .string()
        .trim()
        .email()
        .transform(
          (value) =>
            value.toLowerCase(),
        ),

      password: z
        .string()
        .min(
          8,
          "password must be at least 8 characters.",
        ),
    })
    .strict();

export type CreateInitialOwnerBody =
  z.infer<
    typeof createInitialOwnerSchema
  >;