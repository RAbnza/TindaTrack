import {
  useMemo,
  useState,
} from 'react'

import {
  PageContainer,
} from '../components/layout/PageContainer'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../components/ui'

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
    label: 'Receipts',
  },
  {
    value: 'SALE',
    label: 'Sales',
  },
  {
    value: 'ADJUSTMENT',
    label: 'Adjustments',
  },
]

function formatMovementDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'en-PH',
    {
      timeZone:
        'Asia/Manila',

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
        .stockReceiptItemId !==
        null
        ? `Stock Receipt Item #${movement.source.stockReceiptItemId}`
        : 'Stock Receipt Item'

    case 'ADJUSTMENT':
      return movement.source
        .stockAdjustmentId !==
        null
        ? `Stock Adjustment #${movement.source.stockAdjustmentId}`
        : 'Stock Adjustment'
  }
}

function getMovementLabel(
  movement: StockMovement,
): string {
  switch (movement.type) {
    case 'RECEIPT':
      return 'Stock received'

    case 'SALE':
      return 'Sale'

    case 'ADJUSTMENT_IN':
      return 'Adjustment in'

    case 'ADJUSTMENT_OUT':
      return 'Adjustment out'
  }
}

function isPositiveMovement(
  movement: StockMovement,
): boolean {
  return (
    movement.type ===
      'RECEIPT' ||
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
      [
        movements,
        filter,
      ],
    )

  return (
    <PageContainer>
      <PageHeader
        title="Stock Movements"
        description="Trace when inventory changed, why it changed, and who recorded the action."
      />

      <Card className="mt-6 p-3">
        <div
          aria-label="Movement filters"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {filters.map(
            (option) => {
              const selected =
                filter ===
                option.value

              return (
                <Button
                  key={
                    option.value
                  }
                  variant={
                    selected
                      ? 'primary'
                      : 'secondary'
                  }
                  aria-pressed={
                    selected
                  }
                  className="shrink-0"
                  onClick={() =>
                    setFilter(
                      option.value,
                    )
                  }
                >
                  {
                    option.label
                  }
                </Button>
              )
            },
          )}
        </div>
      </Card>

      {isLoading && (
        <div className="mt-6">
          <LoadingState label="Loading stock movements..." />
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="mt-6">
            <ErrorState
              title="Unable to load stock movements"
              message={
                error
              }
              onRetry={() =>
                void reload()
              }
            />
          </div>
        )}

      {!isLoading &&
        !error &&
        movements.length ===
          0 && (
          <div className="mt-6">
            <EmptyState
              title="No stock movements"
              description="Inventory movement history is currently empty."
            />
          </div>
        )}

      {!isLoading &&
        !error &&
        movements.length > 0 &&
        filteredMovements
          .length ===
          0 && (
          <div className="mt-6">
            <EmptyState
              title="No matching movements"
              description="There are no stock movements for the selected filter."
            />
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredMovements
          .length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-caption font-medium text-muted-foreground">
                History
              </p>

              <span className="text-sm tabular-nums text-muted-foreground">
                {
                  filteredMovements.length
                }{' '}
                {filteredMovements
                  .length ===
                1
                  ? 'movement'
                  : 'movements'}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {filteredMovements.map(
                (
                  movement,
                ) => {
                  const positive =
                    isPositiveMovement(
                      movement,
                    )

                  return (
                    <Card
                      key={
                        movement.id
                      }
                      className="p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold text-foreground">
                            {
                              movement
                                .product
                                .name
                            }
                          </h2>

                          <p className="mt-1 text-xs text-muted-foreground">
                            SKU{' '}
                            {
                              movement
                                .product
                                .sku
                            }
                          </p>

                          <div className="mt-3">
                            <Badge
                              variant={
                                positive
                                  ? 'success'
                                  : 'danger'
                              }
                            >
                              {getMovementLabel(
                                movement,
                              )}
                            </Badge>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">
                            Change
                          </p>

                          <p
                            className={[
                              'mt-1 text-metric font-semibold tabular-nums',
                              positive
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

                      <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            When
                          </dt>

                          <dd className="mt-1 text-sm text-secondary-foreground">
                            {formatMovementDate(
                              movement.createdAt,
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Recorded by
                          </dt>

                          <dd className="mt-1">
                            <p className="text-sm font-medium text-secondary-foreground">
                              {
                                movement
                                  .actor
                                  .name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {movement
                                .actor
                                .role ===
                              'OWNER'
                                ? 'Owner'
                                : 'Staff'}
                            </p>
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Source
                          </dt>

                          <dd className="mt-1 text-sm font-medium text-secondary-foreground">
                            {getSourceLabel(
                              movement,
                            )}
                          </dd>
                        </div>
                      </dl>
                    </Card>
                  )
                },
              )}
            </div>
          </section>
        )}
    </PageContainer>
  )
}