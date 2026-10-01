import "dotenv/config";

import {
  z,
} from "zod";

const baseEnvironmentSchema =
  z.object({
    NODE_ENV:
      z.enum([
        "development",
        "test",
        "production",
      ])
        .default(
          "development",
        ),

    DATABASE_URL:
      z.string()
        .trim()
        .min(
          1,
          "DATABASE_URL is required.",
        )
        .refine(
          (value) => {
            try {
              const url =
                new URL(
                  value,
                );

              return (
                url.protocol ===
                  "postgresql:" ||
                url.protocol ===
                  "postgres:"
              );
            } catch {
              return false;
            }
          },
          {
            message:
              "DATABASE_URL must be a valid PostgreSQL connection URL.",
          },
        ),

    JWT_SECRET:
      z.string()
        .min(
          32,
          "JWT_SECRET must be at least 32 characters long.",
        ),

    PORT:
      z.coerce
        .number()
        .int()
        .positive()
        .max(65535)
        .default(
          3000,
        ),

    CLIENT_ORIGIN:
      z.string()
        .trim()
        .url(
          "CLIENT_ORIGIN must be a valid URL.",
        )
        .optional(),
  });

const parsed =
  baseEnvironmentSchema
    .safeParse(
      process.env,
    );

if (!parsed.success) {
  const problems =
    parsed.error.issues
      .map(
        (issue) =>
          `${issue.path.join(".")}: ${issue.message}`,
      )
      .join("\n");

  throw new Error(
    [
      "Invalid server environment configuration:",
      problems,
    ].join(
      "\n",
    ),
  );
}

if (
  parsed.data.NODE_ENV ===
    "production" &&
  !parsed.data.CLIENT_ORIGIN
) {
  throw new Error(
    "CLIENT_ORIGIN is required when NODE_ENV=production.",
  );
}

export const env = {
  ...parsed.data,

  CLIENT_ORIGIN:
    parsed.data
      .CLIENT_ORIGIN ??
    "http://localhost:5173",
};