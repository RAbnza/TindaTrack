import {
  useState,
} from 'react'

import {
  PageContainer,
} from '../components/layout/PageContainer'

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../components/ui'

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
   * Avoid interpreting YYYY-MM-DD
   * as UTC and shifting the calendar
   * date for the Manila business day.
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
      timeZone:
        'Asia/Manila',

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
  } = useDailySales(
    selectedDate,
  )

  return (
    <PageContainer>
      <PageHeader
        title="Daily Sales"
        description="Review recorded transactions for a selected business day."
      />

      <Card className="mt-6 p-4 sm:p-5">
        <label
          htmlFor="report-date"
          className="block text-sm font-medium text-secondary-foreground"
        >
          Business date
        </label>

        <input
          id="report-date"
          type="date"
          value={
            selectedDate
          }
          onChange={(
            event,
          ) =>
            setSelectedDate(
              event.target
                .value,
            )
          }
          className="mt-2 min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 sm:max-w-xs"
        />
      </Card>

      {isLoading && (
        <div className="mt-6">
          <LoadingState label="Loading daily sales..." />
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="mt-6">
            <ErrorState
              title="Unable to load daily sales"
              message={
                error
              }
            />
          </div>
        )}

      {!isLoading &&
        !error &&
        report && (
          <>
            <section className="mt-6">
              <div className="flex flex-col gap-1">
                <p className="text-caption font-medium text-muted-foreground">
                  Summary
                </p>

                <h2 className="text-section font-semibold text-foreground">
                  {formatReportDate(
                    report.date,
                  )}
                </h2>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground">
                    Total sales
                  </p>

                  <p className="mt-2 text-metric-primary font-semibold tabular-nums text-foreground">
                    {pesoFormatter.format(
                      Number(
                        report.totalSalesAmount,
                      ),
                    )}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Server-reported
                    business-day
                    total
                  </p>
                </Card>

                <Card className="p-5">
                  <p className="text-sm text-muted-foreground">
                    Transactions
                  </p>

                  <p className="mt-2 text-metric-primary font-semibold tabular-nums text-foreground">
                    {
                      report.saleCount
                    }
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Recorded sales
                    for this day
                  </p>
                </Card>
              </div>
            </section>

            <section className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-caption font-medium text-muted-foreground">
                    Transactions
                  </p>

                  <h2 className="mt-1 text-section font-semibold text-foreground">
                    Sales activity
                  </h2>
                </div>

                <span className="text-sm tabular-nums text-muted-foreground">
                  {
                    report.sales
                      .length
                  }{' '}
                  {report.sales
                    .length === 1
                    ? 'sale'
                    : 'sales'}
                </span>
              </div>

              {report.sales
                .length ===
              0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No sales for this date"
                    description="No sales were recorded for the selected business day."
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {report.sales.map(
                    (sale) => (
                      <Card
                        key={
                          sale.id
                        }
                        className="overflow-hidden"
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground">
                                  Sale #
                                  {
                                    sale.id
                                  }
                                </h3>

                                <Badge variant="neutral">
                                  {
                                    sale.paymentMethod
                                  }
                                </Badge>
                              </div>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {formatSaleTime(
                                  sale.createdAt,
                                )}
                              </p>
                            </div>

                            <p className="shrink-0 text-lg font-semibold tabular-nums text-foreground">
                              {pesoFormatter.format(
                                Number(
                                  sale.totalAmount,
                                ),
                              )}
                            </p>
                          </div>

                          <dl className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                            <div>
                              <dt className="text-xs text-muted-foreground">
                                Recorded
                                by
                              </dt>

                              <dd className="mt-1 text-sm font-medium text-secondary-foreground">
                                {
                                  sale
                                    .recordedBy
                                    .name
                                }
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs text-muted-foreground">
                                Item
                                count
                              </dt>

                              <dd className="mt-1 text-sm font-medium tabular-nums text-secondary-foreground">
                                {
                                  sale
                                    .items
                                    .length
                                }{' '}
                                {sale
                                  .items
                                  .length ===
                                1
                                  ? 'line'
                                  : 'lines'}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div className="border-t border-border bg-secondary/30 px-4 py-4 sm:px-5">
                          <p className="mb-3 text-caption font-medium text-muted-foreground">
                            Items
                          </p>

                          <div className="divide-y divide-border/70">
                            {sale.items.map(
                              (
                                item,
                              ) => (
                                <div
                                  key={
                                    item.productId
                                  }
                                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                      {
                                        item.productName
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
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

                                  <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                                    {pesoFormatter.format(
                                      Number(
                                        item.lineTotal,
                                      ),
                                    )}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </Card>
                    ),
                  )}
                </div>
              )}
            </section>
          </>
        )}
    </PageContainer>
  )
}