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
        <h1 className="text-2xl font-bold text-slate-950">
          Stock Movements
        </h1>

        <p className="mt-1 text-sm text-slate-600">
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
                    'min-h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-600',
                    isSelected
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700',
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
          <p className="text-sm text-slate-600">
            Loading stock
            movements...
          </p>
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p
              role="alert"
              className="text-sm text-red-800"
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void reload()
              }
              className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

      {!isLoading &&
        !error &&
        movements.length === 0 && (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
            <p className="font-medium text-slate-800">
              No stock movements
            </p>

            <p className="mt-1 text-sm text-slate-500">
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
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
            <p className="font-medium text-slate-800">
              No matching movements
            </p>

            <p className="mt-1 text-sm text-slate-500">
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
            <p className="text-sm text-slate-500">
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
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold text-slate-950">
                            {
                              movement.product.name
                            }
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            SKU{' '}
                            {
                              movement.product.sku
                            }
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={[
                              'inline-flex rounded-lg px-2.5 py-1 text-xs font-bold',
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800',
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
                              'mt-2 text-2xl font-bold tabular-nums',
                              isPositive
                                ? 'text-emerald-700'
                                : 'text-red-700',
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

                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-700">
                          {formatMovementDate(
                            movement.createdAt,
                          )}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
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

                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Source
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
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