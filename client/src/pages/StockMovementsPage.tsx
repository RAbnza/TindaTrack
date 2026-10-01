import {
  useMemo,
  useState,
} from 'react'

import {
  useStockMovements,
} from '../features/movements/useStockMovements'

import type {
  MovementFilter,
  StockMovement,
} from '../types/stock-movement'

const filters: Array<{
  value: MovementFilter
  label: string
}> = [
  {
    value: 'ALL',
    label: 'All',
  },
  {
    value: 'RECEIPT',
    label: 'Receipt',
  },
  {
    value: 'SALE',
    label: 'Sale',
  },
  {
    value: 'ADJUSTMENT',
    label: 'Adjustment',
  },
]

function formatMovementDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'en-PH',
    {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  ).format(new Date(value))
}

function matchesFilter(
  movement: StockMovement,
  filter: MovementFilter,
): boolean {
  switch (filter) {
    case 'ALL':
      return true

    case 'RECEIPT':
      return (
        movement.type ===
        'RECEIPT'
      )

    case 'SALE':
      return (
        movement.type ===
        'SALE'
      )

    case 'ADJUSTMENT':
      return (
        movement.type ===
          'ADJUSTMENT_IN' ||
        movement.type ===
          'ADJUSTMENT_OUT'
      )
  }
}

function getSourceLabel(
  movement: StockMovement,
): string {
  switch (movement.source.type) {
    case 'SALE':
      return movement.source
        .saleItemId !== null
        ? `Sale Item #${movement.source.saleItemId}`
        : 'Sale Item'

    case 'RECEIPT':
      return movement.source
        .stockReceiptItemId !== null
        ? `Stock Receipt Item #${movement.source.stockReceiptItemId}`
        : 'Stock Receipt Item'

    case 'ADJUSTMENT':
      return movement.source
        .stockAdjustmentId !== null
        ? `Stock Adjustment #${movement.source.stockAdjustmentId}`
        : 'Stock Adjustment'
  }
}

function isPositiveMovement(
  movement: StockMovement,
): boolean {
  return (
    movement.type === 'RECEIPT' ||
    movement.type ===
      'ADJUSTMENT_IN'
  )
}

function formatQuantityDelta(
  quantityDelta: number,
): string {
  return quantityDelta > 0
    ? `+${quantityDelta}`
    : String(quantityDelta)
}

export function StockMovementsPage() {
  const {
    movements,
    isLoading,
    error,
    reload,
  } = useStockMovements()

  const [
    filter,
    setFilter,
  ] =
    useState<MovementFilter>(
      'ALL',
    )

  const filteredMovements =
    useMemo(
      () =>
        movements.filter(
          (movement) =>
            matchesFilter(
              movement,
              filter,
            ),
        ),
      [movements, filter],
    )

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Stock Movements
        </h1>

        <p className="mt-1 text-sm text-secondary-foreground">
          Review why inventory
          quantities changed.
        </p>
      </div>

      <section className="mt-6">
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Movement filters"
        >
          {filters.map(
            (option) => {
              const isSelected =
                filter ===
                option.value

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  aria-pressed={
                    isSelected
                  }
                  onClick={() =>
                    setFilter(
                      option.value,
                    )
                  }
                  className={[
                    'min-h-11 shrink-0 rounded-lg border px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-card text-secondary-foreground',
                  ].join(' ')}
                >
                  {
                    option.label
                  }
                </button>
              )
            },
          )}
        </div>
      </section>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-secondary-foreground">
            Loading stock
            movements...
          </p>
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive-soft p-4">
            <p
              role="alert"
              className="text-sm text-secondary-foreground"
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void reload()
              }
              className="mt-4 min-h-11 rounded-lg bg-destructive px-4 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        )}

      {!isLoading &&
        !error &&
        movements.length === 0 && (
          <section className="mt-8 rounded-lg border border-dashed border-input bg-card px-4 py-10 text-center">
            <p className="font-medium text-secondary-foreground">
              No stock movements
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Inventory movement
              history is empty.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        movements.length > 0 &&
        filteredMovements.length ===
          0 && (
          <section className="mt-8 rounded-lg border border-dashed border-input bg-card px-4 py-10 text-center">
            <p className="font-medium text-secondary-foreground">
              No matching movements
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              There are no movements
              for this filter.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        filteredMovements.length >
          0 && (
          <section className="mt-6">
            <p className="text-sm text-muted-foreground">
              {
                filteredMovements.length
              }{' '}
              {filteredMovements.length ===
              1
                ? 'movement'
                : 'movements'}
            </p>

            <div className="mt-3 space-y-3">
              {filteredMovements.map(
                (movement) => {
                  const isPositive =
                    isPositiveMovement(
                      movement,
                    )

                  return (
                    <article
                      key={
                        movement.id
                      }
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-foreground">
                            {
                              movement.product.name
                            }
                          </h2>

                          <p className="mt-1 text-sm text-muted-foreground">
                            SKU{' '}
                            {
                              movement.product.sku
                            }
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={[
                              'inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold',
                              isPositive
                                ? 'bg-success-soft text-secondary-foreground'
                                : 'bg-destructive-soft text-secondary-foreground',
                            ].join(
                              ' ',
                            )}
                          >
                            {
                              movement.type
                            }
                          </span>

                          <p
                            className={[
                              'mt-2 text-2xl font-semibold tabular-nums',
                              isPositive
                                ? 'text-success'
                                : 'text-destructive',
                            ].join(
                              ' ',
                            )}
                          >
                            {formatQuantityDelta(
                              movement.quantityDelta,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-border/60 pt-4">
                        <p className="text-sm text-secondary-foreground">
                          {formatMovementDate(
                            movement.createdAt,
                          )}
                        </p>

                        <p className="mt-1 text-sm text-secondary-foreground">
                          {
                            movement.actor.name
                          }{' '}
                          ·{' '}
                          {movement.actor.role ===
                          'OWNER'
                            ? 'Owner'
                            : 'Staff'}
                        </p>
                      </div>

                      <div className="mt-4 rounded-lg bg-background p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                          Source
                        </p>

                        <p className="mt-1 text-sm font-semibold text-secondary-foreground">
                          {getSourceLabel(
                            movement,
                          )}
                        </p>
                      </div>
                    </article>
                  )
                },
              )}
            </div>
          </section>
        )}
    </main>
  )
}
