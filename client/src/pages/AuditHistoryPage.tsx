import {
  useMemo,
  useState,
  type ReactNode,
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
  useAuditLogs,
} from '../features/audit/useAuditLogs'

import type {
  AuditFilter,
  AuditLog,
  SaleCreatedMetadata,
  StockAdjustmentCreatedMetadata,
  StockReceiptCreatedMetadata,
} from '../types/audit-log'

const filters: Array<{
  value: AuditFilter
  label: string
}> = [
  {
    value: 'ALL',
    label: 'All',
  },
  {
    value: 'SALES',
    label: 'Sales',
  },
  {
    value: 'RECEIPTS',
    label: 'Receipts',
  },
  {
    value: 'ADJUSTMENTS',
    label: 'Adjustments',
  },
]

const pesoFormatter =
  new Intl.NumberFormat(
    'en-PH',
    {
      style: 'currency',
      currency: 'PHP',
    },
  )

function formatAuditDate(
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

function formatAction(
  action: string,
): string {
  return action
    .split('_')
    .map(
      (part) =>
        part.charAt(0) +
        part
          .slice(1)
          .toLowerCase(),
    )
    .join(' ')
}

function formatEntityType(
  entityType: string,
): string {
  return entityType.replace(
    /([a-z])([A-Z])/g,
    '$1 $2',
  )
}

function matchesFilter(
  log: AuditLog,
  filter: AuditFilter,
): boolean {
  switch (filter) {
    case 'ALL':
      return true

    case 'SALES':
      return (
        log.action ===
        'SALE_CREATED'
      )

    case 'RECEIPTS':
      return (
        log.action ===
        'STOCK_RECEIPT_CREATED'
      )

    case 'ADJUSTMENTS':
      return (
        log.action ===
        'STOCK_ADJUSTMENT_CREATED'
      )
  }
}

function getActionBadgeVariant(
  action: string,
):
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning' {
  switch (action) {
    case 'SALE_CREATED':
      return 'info'

    case 'STOCK_RECEIPT_CREATED':
      return 'success'

    case 'STOCK_ADJUSTMENT_CREATED':
      return 'warning'

    default:
      return 'neutral'
  }
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isSaleCreatedMetadata(
  value: unknown,
): value is SaleCreatedMetadata {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.totalAmount ===
      'string' &&
    typeof value.paymentMethod ===
      'string' &&
    typeof value.itemCount ===
      'number'
  )
}

function isStockReceiptCreatedMetadata(
  value: unknown,
): value is StockReceiptCreatedMetadata {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.supplierId ===
      'number' &&
    (
      typeof value.referenceNo ===
        'string' ||
      value.referenceNo ===
        null
    ) &&
    typeof value.itemCount ===
      'number'
  )
}

function isStockAdjustmentCreatedMetadata(
  value: unknown,
): value is StockAdjustmentCreatedMetadata {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.productId ===
      'number' &&
    typeof value.quantityDelta ===
      'number' &&
    typeof value.reason ===
      'string' &&
    typeof value.movementType ===
      'string'
  )
}

function formatUnknownValue(
  value: unknown,
): string {
  if (value === null) {
    return 'None'
  }

  if (
    typeof value ===
      'string' ||
    typeof value ===
      'number' ||
    typeof value ===
      'boolean'
  ) {
    return String(value)
  }

  try {
    return JSON.stringify(
      value,
    )
  } catch {
    return 'Unavailable'
  }
}

function formatMetadataKey(
  key: string,
): string {
  const spaced =
    key
      .replace(
        /([a-z])([A-Z])/g,
        '$1 $2',
      )
      .replace(
        /_/g,
        ' ',
      )

  return (
    spaced
      .charAt(0)
      .toUpperCase() +
    spaced.slice(1)
  )
}

type MetadataRowProps = {
  label: string
  children: ReactNode
}

function MetadataRow({
  label,
  children,
}: MetadataRowProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4">
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>

      <dd className="wrap-break-words text-sm font-medium text-secondary-foreground sm:text-right">
        {children}
      </dd>
    </div>
  )
}

function AuditMetadataView({
  log,
}: {
  log: AuditLog
}) {
  if (
    log.action ===
      'SALE_CREATED' &&
    isSaleCreatedMetadata(
      log.metadata,
    )
  ) {
    return (
      <dl className="space-y-3">
        <MetadataRow label="Payment method">
          {
            log.metadata
              .paymentMethod
          }
        </MetadataRow>

        <MetadataRow label="Items">
          {
            log.metadata
              .itemCount
          }
        </MetadataRow>

        <MetadataRow label="Total">
          {pesoFormatter.format(
            Number(
              log.metadata
                .totalAmount,
            ),
          )}
        </MetadataRow>
      </dl>
    )
  }

  if (
    log.action ===
      'STOCK_RECEIPT_CREATED' &&
    isStockReceiptCreatedMetadata(
      log.metadata,
    )
  ) {
    return (
      <dl className="space-y-3">
        <MetadataRow label="Supplier ID">
          {
            log.metadata
              .supplierId
          }
        </MetadataRow>

        <MetadataRow label="Items">
          {
            log.metadata
              .itemCount
          }
        </MetadataRow>

        <MetadataRow label="Reference">
          {log.metadata
            .referenceNo ??
            'None'}
        </MetadataRow>
      </dl>
    )
  }

  if (
    log.action ===
      'STOCK_ADJUSTMENT_CREATED' &&
    isStockAdjustmentCreatedMetadata(
      log.metadata,
    )
  ) {
    return (
      <dl className="space-y-3">
        <MetadataRow label="Product ID">
          {
            log.metadata
              .productId
          }
        </MetadataRow>

        <MetadataRow label="Inventory change">
          <span
            className={
              log.metadata
                .quantityDelta >
              0
                ? 'text-success'
                : 'text-destructive'
            }
          >
            {log.metadata
              .quantityDelta >
            0
              ? '+'
              : ''}
            {
              log.metadata
                .quantityDelta
            }
          </span>
        </MetadataRow>

        <MetadataRow label="Movement type">
          {
            log.metadata
              .movementType
          }
        </MetadataRow>

        <MetadataRow label="Reason">
          {
            log.metadata.reason
          }
        </MetadataRow>
      </dl>
    )
  }

  /*
   * Defensive fallback for future or
   * unknown audit metadata shapes.
   *
   * Do not assume every event will keep
   * one of the known schemas above.
   */
  if (
    isRecord(log.metadata)
  ) {
    const entries =
      Object.entries(
        log.metadata,
      )

    if (
      entries.length === 0
    ) {
      return (
        <p className="text-sm text-muted-foreground">
          No additional
          metadata.
        </p>
      )
    }

    return (
      <dl className="space-y-3">
        {entries.map(
          ([
            key,
            value,
          ]) => (
            <MetadataRow
              key={key}
              label={formatMetadataKey(
                key,
              )}
            >
              {formatUnknownValue(
                value,
              )}
            </MetadataRow>
          ),
        )}
      </dl>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      No additional metadata.
    </p>
  )
}

export function AuditHistoryPage() {
  const {
    logs,
    isLoading,
    error,
    reload,
  } = useAuditLogs()

  const [
    filter,
    setFilter,
  ] =
    useState<AuditFilter>(
      'ALL',
    )

  const filteredLogs =
    useMemo(
      () =>
        logs.filter(
          (log) =>
            matchesFilter(
              log,
              filter,
            ),
        ),
      [
        logs,
        filter,
      ],
    )

  return (
    <PageContainer>
      <PageHeader
        title="Audit History"
        description="Review important business actions, who performed them, and the evidence recorded with each event."
      />

      <Card className="mt-6 p-3">
        <div
          aria-label="Audit filters"
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
          <LoadingState label="Loading audit history..." />
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="mt-6">
            <ErrorState
              title="Unable to load audit history"
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
        logs.length ===
          0 && (
          <div className="mt-6">
            <EmptyState
              title="No audit history"
              description="No audited business actions have been recorded yet."
            />
          </div>
        )}

      {!isLoading &&
        !error &&
        logs.length > 0 &&
        filteredLogs.length ===
          0 && (
          <div className="mt-6">
            <EmptyState
              title="No matching audit events"
              description="There are no audit events for the selected filter."
            />
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredLogs.length >
          0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-caption font-medium text-muted-foreground">
                Evidence
              </p>

              <span className="text-sm tabular-nums text-muted-foreground">
                {
                  filteredLogs.length
                }{' '}
                {filteredLogs.length ===
                1
                  ? 'event'
                  : 'events'}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {filteredLogs.map(
                (log) => (
                  <Card
                    key={
                      log.id
                    }
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-semibold text-foreground">
                              {formatAction(
                                log.action,
                              )}
                            </h2>

                            <Badge
                              variant={getActionBadgeVariant(
                                log.action,
                              )}
                            >
                              {log.action ===
                              'SALE_CREATED'
                                ? 'Sale'
                                : log.action ===
                                    'STOCK_RECEIPT_CREATED'
                                  ? 'Receipt'
                                  : log.action ===
                                      'STOCK_ADJUSTMENT_CREATED'
                                    ? 'Adjustment'
                                    : 'Event'}
                            </Badge>
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">
                            {formatAuditDate(
                              log.createdAt,
                            )}
                          </p>
                        </div>

                        <Badge variant="neutral">
                          {log.actor
                            .role ===
                          'OWNER'
                            ? 'Owner'
                            : 'Staff'}
                        </Badge>
                      </div>

                      <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Actor
                          </dt>

                          <dd className="mt-1 text-sm font-medium text-secondary-foreground">
                            {
                              log.actor
                                .name
                            }
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Entity
                          </dt>

                          <dd className="mt-1 text-sm font-medium text-secondary-foreground">
                            {log.entityType
                              ? formatEntityType(
                                  log.entityType,
                                )
                              : 'Unknown entity'}

                            {log.entityId !==
                            null
                              ? ` #${log.entityId}`
                              : ''}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="border-t border-border bg-secondary/30 px-4 py-4 sm:px-5">
                      <p className="mb-3 text-caption font-medium text-muted-foreground">
                        Metadata
                      </p>

                      <AuditMetadataView
                        log={
                          log
                        }
                      />
                    </div>
                  </Card>
                ),
              )}
            </div>
          </section>
        )}
    </PageContainer>
  )
}