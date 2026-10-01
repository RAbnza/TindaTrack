import {
  useMemo,
  useState,
  type ReactNode,
} from 'react'

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

function formatAction(
  action: string,
): string {
  return action
    .split('_')
    .join(' ')
}

function formatEntityType(
  entityType: string,
): string {
  return entityType
    .replace(
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

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === 'object' &&
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
      value.referenceNo === null
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
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return 'Unavailable'
  }
}

function formatMetadataKey(
  key: string,
): string {
  const spaced = key
    .replace(
      /([a-z])([A-Z])/g,
      '$1 $2',
    )
    .replace(/_/g, ' ')

  return (
    spaced.charAt(0).toUpperCase() +
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
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-slate-500">
        {label}
      </dt>

      <dd className="text-right text-sm font-medium text-slate-800">
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
      <dl className="space-y-2">
        <MetadataRow label="Payment">
          {
            log.metadata
              .paymentMethod
          }
        </MetadataRow>

        <MetadataRow label="Items">
          {
            log.metadata.itemCount
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
      <dl className="space-y-2">
        <MetadataRow label="Supplier ID">
          {
            log.metadata
              .supplierId
          }
        </MetadataRow>

        <MetadataRow label="Items">
          {
            log.metadata.itemCount
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
      <dl className="space-y-2">
        <MetadataRow label="Product ID">
          {
            log.metadata
              .productId
          }
        </MetadataRow>

        <MetadataRow label="Change">
          <span
            className={
              log.metadata
                .quantityDelta > 0
                ? 'text-emerald-700'
                : 'text-red-700'
            }
          >
            {log.metadata
              .quantityDelta > 0
              ? '+'
              : ''}
            {
              log.metadata
                .quantityDelta
            }
          </span>
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
   * Unknown audit event fallback.
   *
   * We don't assume every future action
   * has the same metadata structure.
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
        <p className="text-sm text-slate-500">
          No additional metadata.
        </p>
      )
    }

    return (
      <dl className="space-y-2">
        {entries.map(
          ([key, value]) => (
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
    <p className="text-sm text-slate-500">
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
      [logs, filter],
    )

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">
          Audit History
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Review important business
          actions and who performed
          them.
        </p>
      </div>

      <section className="mt-6">
        <div
          aria-label="Audit filters"
          className="flex gap-2 overflow-x-auto pb-1"
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
            Loading audit
            history...
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
        logs.length === 0 && (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
            <p className="font-medium text-slate-800">
              No audit history
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No audited business
              actions have been
              recorded yet.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        logs.length > 0 &&
        filteredLogs.length ===
          0 && (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
            <p className="font-medium text-slate-800">
              No matching audit events
            </p>

            <p className="mt-1 text-sm text-slate-500">
              There are no audit
              events for this filter.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        filteredLogs.length >
          0 && (
          <section className="mt-6">
            <p className="text-sm text-slate-500">
              {
                filteredLogs.length
              }{' '}
              {filteredLogs.length ===
              1
                ? 'event'
                : 'events'}
            </p>

            <div className="mt-3 space-y-3">
              {filteredLogs.map(
                (log) => (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div>
                      <h2 className="text-base font-bold text-slate-950">
                        {formatAction(
                          log.action,
                        )}
                      </h2>

                      <p className="mt-3 text-sm font-medium text-slate-800">
                        {
                          log.actor
                            .name
                        }{' '}
                        ·{' '}
                        {log.actor
                          .role ===
                        'OWNER'
                          ? 'Owner'
                          : 'Staff'}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatAuditDate(
                          log.createdAt,
                        )}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Entity
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {log.entityType
                          ? formatEntityType(
                              log.entityType,
                            )
                          : 'Unknown entity'}

                        {log.entityId !==
                        null
                          ? ` #${log.entityId}`
                          : ''}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Details
                      </p>

                      <AuditMetadataView
                        log={log}
                      />
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        )}
    </main>
  )
}