const MANILA_UTC_OFFSET_HOURS = 8;

export type BusinessDayRange = {
  start: Date;
  end: Date;
};

export function getManilaDayRange(
  date: string,
): BusinessDayRange {
  const [
    yearText,
    monthText,
    dayText,
  ] = date.split("-");

  const year =
    Number(yearText);

  const month =
    Number(monthText);

  const day =
    Number(dayText);

  /*
   * Asia/Manila is UTC+8 and does not
   * observe daylight-saving time.
   *
   * 2026-10-01 00:00 +08:00
   * = 2026-09-30 16:00 UTC
   */
  const start =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        -MANILA_UTC_OFFSET_HOURS,
      ),
    );

  const end =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + 1,
        -MANILA_UTC_OFFSET_HOURS,
      ),
    );

  return {
    start,
    end,
  };
}

export function getManilaDateString(
  now: Date = new Date(),
): string {
  /*
   * Shift the instant by +8 hours,
   * then read its UTC calendar fields.
   */
  const manilaTime =
    new Date(
      now.getTime() +
        MANILA_UTC_OFFSET_HOURS *
          60 *
          60 *
          1000,
    );

  const year =
    manilaTime.getUTCFullYear();

  const month =
    String(
      manilaTime.getUTCMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      manilaTime.getUTCDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}