import {
  useState,
} from 'react'

import {
  useDailySales,
} from '../features/reports/useDailySales'

function getLocalDateInputValue(): string {
  const now = new Date()

  const year =
    now.getFullYear()

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    now.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatReportDate(
  date: string,
): string {
  const [
    yearText,
    monthText,
    dayText,
  ] = date.split('-')

  const year =
    Number(yearText)

  const month =
    Number(monthText)

  const day =
    Number(dayText)

  /*
   * Construct a local calendar date instead
   * of parsing "YYYY-MM-DD" through UTC.
   */
  const localDate =
    new Date(
      year,
      month - 1,
      day,
    )

  return new Intl.DateTimeFormat(
    'en-PH',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  ).format(localDate)
}

function formatSaleTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'en-PH',
    {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  ).format(new Date(value))
}

const pesoFormatter =
  new Intl.NumberFormat(
    'en-PH',
    {
      style: 'currency',
      currency: 'PHP',
    },
  )

export function DailySalesPage() {
  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getLocalDateInputValue,
  )

  const {
    report,
    isLoading,
    error,
  } =
    useDailySales(
      selectedDate,
    )

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Daily Sales
        </h1>

        <p className="mt-1 text-sm text-secondary-foreground">
          Review recorded sales for
          a selected business day.
        </p>
      </div>

      <section className="mt-6">
        <label
          htmlFor="report-date"
          className="block text-sm font-medium text-secondary-foreground"
        >
          Date
        </label>

        <input
          id="report-date"
          type="date"
          value={selectedDate}
          onChange={(event) =>
            setSelectedDate(
              event.target.value,
            )
          }
          className="mt-2 min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
        />
      </section>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-secondary-foreground">
            Loading daily sales...
          </p>
        </div>
      )}

      {!isLoading &&
        error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-destructive/20 bg-destructive-soft p-4"
          >
            <p className="text-sm text-secondary-foreground">
              {error}
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        report && (
          <>
            <section className="mt-7">
              <h2 className="text-xl font-semibold text-foreground">
                {formatReportDate(
                  report.date,
                )}
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-secondary-foreground">
                    Sales count
                  </p>

                  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                    {
                      report.saleCount
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-secondary-foreground">
                    Total sales
                  </p>

                  <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                    {pesoFormatter.format(
                      Number(
                        report.totalSalesAmount,
                      ),
                    )}
                  </p>
                </div>
              </div>
            </section>

            {report.sales.length ===
            0 ? (
              <section className="mt-8 rounded-lg border border-dashed border-input bg-card px-4 py-10 text-center">
                <p className="font-medium text-secondary-foreground">
                  No sales recorded
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  There are no sales
                  for this date.
                </p>
              </section>
            ) : (
              <section className="mt-8 border-t border-border pt-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Sales
                </h2>

                <div className="mt-3 space-y-4">
                  {report.sales.map(
                    (sale) => (
                      <article
                        key={
                          sale.id
                        }
                        className="rounded-lg border border-border bg-card p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              Sale #
                              {
                                sale.id
                              }
                            </h3>

                            <p className="mt-1 text-sm text-secondary-foreground">
                              {formatSaleTime(
                                sale.createdAt,
                              )}
                            </p>
                          </div>

                          <span className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                            {
                              sale.paymentMethod
                            }
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-secondary-foreground">
                          Recorded by:{' '}
                          <span className="font-medium text-secondary-foreground">
                            {
                              sale
                                .recordedBy
                                .name
                            }
                          </span>
                        </p>

                        <div className="mt-5 divide-y divide-border/60 border-y border-border">
                          {sale.items.map(
                            (
                              item,
                            ) => (
                              <div
                                key={
                                  item.productId
                                }
                                className="py-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {
                                        item.productName
                                      }
                                    </p>

                                    <p className="mt-1 text-sm text-secondary-foreground">
                                      {
                                        item.quantity
                                      }{' '}
                                      ×{' '}
                                      {pesoFormatter.format(
                                        Number(
                                          item.unitPrice,
                                        ),
                                      )}
                                    </p>
                                  </div>

                                  <p className="shrink-0 font-semibold tabular-nums text-foreground">
                                    {pesoFormatter.format(
                                      Number(
                                        item.lineTotal,
                                      ),
                                    )}
                                  </p>
                                </div>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <p className="font-semibold text-secondary-foreground">
                            Sale total
                          </p>

                          <p className="text-lg font-semibold tabular-nums text-foreground">
                            {pesoFormatter.format(
                              Number(
                                sale.totalAmount,
                              ),
                            )}
                          </p>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </section>
            )}
          </>
        )}
    </main>
  )
}
