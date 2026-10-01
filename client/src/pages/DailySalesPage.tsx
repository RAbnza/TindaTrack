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
        <h1 className="text-2xl font-bold text-slate-950">
          Daily Sales
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Review recorded sales for
          a selected business day.
        </p>
      </div>

      <section className="mt-6">
        <label
          htmlFor="report-date"
          className="block text-sm font-medium text-slate-800"
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
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </section>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-600">
            Loading daily sales...
          </p>
        </div>
      )}

      {!isLoading &&
        error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm text-red-800">
              {error}
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        report && (
          <>
            <section className="mt-7">
              <h2 className="text-xl font-bold text-slate-950">
                {formatReportDate(
                  report.date,
                )}
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-600">
                    Sales count
                  </p>

                  <p className="mt-2 text-3xl font-bold tabular-nums text-slate-950">
                    {
                      report.saleCount
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-600">
                    Total sales
                  </p>

                  <p className="mt-2 text-xl font-bold tabular-nums text-slate-950">
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
              <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
                <p className="font-medium text-slate-800">
                  No sales recorded
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  There are no sales
                  for this date.
                </p>
              </section>
            ) : (
              <section className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-lg font-bold text-slate-950">
                  Sales
                </h2>

                <div className="mt-3 space-y-4">
                  {report.sales.map(
                    (sale) => (
                      <article
                        key={
                          sale.id
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-slate-950">
                              Sale #
                              {
                                sale.id
                              }
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              {formatSaleTime(
                                sale.createdAt,
                              )}
                            </p>
                          </div>

                          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {
                              sale.paymentMethod
                            }
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                          Recorded by:{' '}
                          <span className="font-medium text-slate-800">
                            {
                              sale
                                .recordedBy
                                .name
                            }
                          </span>
                        </p>

                        <div className="mt-5 divide-y divide-slate-100 border-y border-slate-200">
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
                                    <p className="font-medium text-slate-950">
                                      {
                                        item.productName
                                      }
                                    </p>

                                    <p className="mt-1 text-sm text-slate-600">
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

                                  <p className="shrink-0 font-semibold tabular-nums text-slate-950">
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
                          <p className="font-semibold text-slate-800">
                            Sale total
                          </p>

                          <p className="text-lg font-bold tabular-nums text-slate-950">
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