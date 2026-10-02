import { useState } from 'react'
import { flushSync } from 'react-dom'
import { PageContainer } from '../components/layout/PageContainer'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../components/ui'
import { DataTable } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { Input, FormField } from '../components/ui/Field'
import { browseDailySales } from '../api/workspace.api'
import { getDailySales } from '../api/reports.api'
import { usePagedQuery } from '../features/workspace/usePagedQuery'
import { pesoFormatter } from '../features/workspace/format'
import type { DailySalesReport } from '../types/report'

function getLocalDateInputValue(): string {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000)

  const year = now.getUTCFullYear()

  const month = String(now.getUTCMonth() + 1).padStart(2, '0')

  const day = String(now.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatReportDate(date: string): string {
  const [yearText, monthText, dayText] = date.split('-')

  const year = Number(yearText)

  const month = Number(monthText)

  const day = Number(dayText)

  const localDate = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(localDate)
}

function formatSaleDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',

    year: 'numeric',
    month: 'short',
    day: 'numeric',

    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

function escapeCsvValue(value: string | number): string {
  const text = String(value)

  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')

  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8',
  })

  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename

  document.body.appendChild(anchor)

  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

export function DailySalesPage() {
  const [query, setQuery] = useState({
    date: getLocalDateInputValue(),
    page: 1,
    pageSize: 25,
  })
  const {
    data: report,
    isLoading,
    error,
    reload,
  } = usePagedQuery(browseDailySales, query)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [printReport, setPrintReport] = useState<DailySalesReport | null>(null)

  async function handleExport(kind: 'csv' | 'print') {
    if (exporting || !report) return
    setExporting(true)
    setExportError(null)
    try {
      // Full-day data is fetched only on an explicit export/print action.
      const complete = await getDailySales(query.date)
      if (kind === 'print') {
        flushSync(() => setPrintReport(complete))
        window.print()
        setPrintReport(null)
      } else {
        const rows: Array<Array<string | number>> = [
          [
            'sale_id',
            'date_time',
            'payment_method',
            'recorded_by',
            'product',
            'quantity',
            'unit_price',
            'line_total',
            'sale_total',
          ],
        ]
        for (const sale of complete.sales)
          for (const item of sale.items)
            rows.push([
              sale.id,
              sale.createdAt,
              sale.paymentMethod,
              sale.recordedBy.name,
              item.productName,
              item.quantity,
              item.unitPrice,
              item.lineTotal,
              sale.totalAmount,
            ])
        downloadCsv(`tindatrack-daily-sales-${complete.date}.csv`, rows)
      }
    } catch {
      setExportError('Unable to export the full daily report. Please try again.')
    } finally {
      setExporting(false)
    }
  }
  return (
    <PageContainer>
      <div className="no-print">
        <PageHeader
          icon="reports"
          title="Daily Sales"
          description="Review the selected Manila business day, with totals across every transaction."
          actions={
            <>
              <Button
                variant="secondary"
                disabled={!report || isLoading || exporting}
                onClick={() => void handleExport('print')}
              >
                Print / Save PDF
              </Button>
              <Button
                variant="secondary"
                disabled={!report || isLoading || exporting}
                onClick={() => void handleExport('csv')}
              >
                {exporting ? 'Preparing report...' : 'Export CSV'}
              </Button>
            </>
          }
        />
        <Card surface="tint" className="mt-5 p-4">
          <FormField id="report-date" label="Business date">
            <Input
              id="report-date"
              className="max-w-xs"
              type="date"
              disabled={exporting}
              value={query.date}
              onChange={(e) => setQuery((q) => ({ ...q, date: e.target.value, page: 1 }))}
            />
          </FormField>
        </Card>
        {exportError && (
          <p role="alert" className="mt-3 text-destructive">
            {exportError}
          </p>
        )}
        {isLoading ? (
          <LoadingState label="Loading daily sales..." />
        ) : error ? (
          <ErrorState
            title="Unable to load daily sales"
            message={error}
            onRetry={reload}
          />
        ) : (
          report && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Card surface="accent" className="p-4">
                  <p className="text-ui text-accent-foreground">Total sales</p>
                  <p className="mt-2 text-metric font-semibold tabular-nums text-primary">
                    {pesoFormatter.format(Number(report.totalSalesAmount))}
                  </p>
                </Card>
                <Card surface="tint" className="p-4">
                  <p className="text-ui text-secondary-foreground">Transactions</p>
                  <p className="mt-2 text-metric font-semibold tabular-nums">
                    {report.saleCount}
                  </p>
                </Card>
              </div>
              <h2 className="mt-5 text-section font-semibold">
                {formatReportDate(report.date)}
              </h2>
              <Card className="mt-3 overflow-hidden">
                {report.sales.length === 0 ? (
                  <EmptyState
                    title="No sales for this date"
                    description="No sales were recorded for the selected business day."
                  />
                ) : (
                  <DataTable
                    caption="Daily sales transactions"
                    headings={[
                      'Sale / time',
                      'Payment',
                      'Recorded by',
                      { label: 'Total', numeric: true },
                      'Items',
                    ]}
                  >
                    {report.sales.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <p className="font-semibold">Sale #{sale.id}</p>
                          <p className="text-caption text-muted-foreground">
                            {formatSaleDateTime(sale.createdAt)}
                          </p>
                        </td>
                        <td>
                          <Badge variant="info">{sale.paymentMethod}</Badge>
                        </td>
                        <td>{sale.recordedBy.name}</td>
                        <td className="numeric font-semibold">
                          {pesoFormatter.format(Number(sale.totalAmount))}
                        </td>
                        <td>
                          <details>
                            <summary>{sale.items.length} items · View</summary>
                            <ul className="space-y-3">
                              {sale.items.map((item) => (
                                <li
                                  key={item.productId}
                                  className="rounded-lg bg-surface-tint p-3"
                                >
                                  <p className="font-medium">{item.productName}</p>
                                  <p>
                                    {item.quantity} ×{' '}
                                    {pesoFormatter.format(Number(item.unitPrice))}
                                  </p>
                                  <p className="font-semibold">
                                    {pesoFormatter.format(Number(item.lineTotal))}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
                <Pagination
                  label="Daily sales"
                  meta={report.pagination}
                  onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
                  onPageSizeChange={(pageSize) =>
                    setQuery((q) => ({ ...q, pageSize, page: 1 }))
                  }
                />
              </Card>
            </>
          )
        )}
      </div>
      {printReport && (
        <div className="daily-sales-print-document hidden">
          <header className="daily-sales-print-header">
            <h1>TindaTrack</h1>
            <p>Daily Sales Report · {formatReportDate(printReport.date)}</p>
          </header>
          <p>
            {printReport.saleCount} transactions ·{' '}
            {pesoFormatter.format(Number(printReport.totalSalesAmount))}
          </p>
          {printReport.sales.map((sale) => (
            <section key={sale.id} className="daily-sales-print-sale mt-5">
              <h2>
                Sale #{sale.id} · {formatSaleDateTime(sale.createdAt)}
              </h2>
              <p>
                {sale.paymentMethod} · {sale.recordedBy.name} ·{' '}
                {pesoFormatter.format(Number(sale.totalAmount))}
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((i) => (
                    <tr key={i.productId}>
                      <td>{i.productName}</td>
                      <td>{i.quantity}</td>
                      <td>{pesoFormatter.format(Number(i.unitPrice))}</td>
                      <td>{pesoFormatter.format(Number(i.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
