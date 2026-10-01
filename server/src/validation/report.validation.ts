import * as z from "zod";

function isValidCalendarDate(
  value: string,
): boolean {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const candidate = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );

  return (
    candidate.getUTCFullYear() ===
      year &&
    candidate.getUTCMonth() ===
      month - 1 &&
    candidate.getUTCDate() === day
  );
}

export const dailySalesQuerySchema = z
  .object({
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "date must use YYYY-MM-DD format.",
      )
      .refine(
        isValidCalendarDate,
        "date must be a valid calendar date.",
      ),
  })
  .strict();