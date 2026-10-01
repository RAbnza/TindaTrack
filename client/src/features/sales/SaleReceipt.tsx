import {
  Button,
  Card,
} from '../../components/ui'

import type {
  CreatedSale,
} from '../../types/sale'

type SaleReceiptProps = {
  sale: CreatedSale
  onDismiss: () => void
}

const pesoFormatter =
  new Intl.NumberFormat(
    'en-PH',
    {
      style: 'currency',
      currency: 'PHP',
    },
  )

function formatSaleDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'en-PH',
    {
      timeZone:
        'Asia/Manila',

      year: 'numeric',
      month: 'long',
      day: 'numeric',

      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  ).format(new Date(value))
}

export function SaleReceipt({
  sale,
  onDismiss,
}: SaleReceiptProps) {
  return (
    <Card className="print-document mt-6 overflow-hidden">
      <div className="no-print flex flex-col gap-3 border-b border-success/20 bg-success-soft p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">
            Sale recorded
          </p>

          <p className="mt-1 text-sm text-secondary-foreground">
            Sale #{sale.id} is
            ready to print.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              window.print()
            }
          >
            Print receipt
          </Button>

          <Button
            variant="ghost"
            onClick={
              onDismiss
            }
          >
            Dismiss
          </Button>
        </div>
      </div>

      <div className="receipt-print-body p-5 sm:p-6">
        <header className="text-center">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            TindaTrack
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Sale Receipt
          </p>
        </header>

        <dl className="mt-6 space-y-2 border-y border-border py-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Transaction
            </dt>

            <dd className="font-medium text-foreground">
              #{sale.id}
            </dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Date & time
            </dt>

            <dd className="text-right font-medium text-foreground">
              {formatSaleDateTime(
                sale.createdAt,
              )}
            </dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Recorded by
            </dt>

            <dd className="text-right font-medium text-foreground">
              {
                sale.recordedByName
              }
            </dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Payment
            </dt>

            <dd className="font-medium text-foreground">
              {
                sale.paymentMethod
              }
            </dd>
          </div>
        </dl>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">
            Items
          </h3>

          <div className="mt-3 divide-y divide-border">
            {sale.items.map(
              (item) => (
                <div
                  key={
                    item.productId
                  }
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {
                        item.productName
                      }
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
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

                  <p className="shrink-0 font-medium tabular-nums text-foreground">
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
        </section>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
          <p className="font-semibold text-foreground">
            Total
          </p>

          <p className="text-xl font-semibold tabular-nums text-foreground">
            {pesoFormatter.format(
              Number(
                sale.totalAmount,
              ),
            )}
          </p>
        </div>
      </div>
    </Card>
  )
}