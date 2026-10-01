import type { ReactNode } from 'react'
import type {
  AuditLog,
  SaleCreatedMetadata,
  StockAdjustmentCreatedMetadata,
  StockReceiptCreatedMetadata,
} from '../../types/audit-log'
import { pesoFormatter } from '../workspace/format'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSaleCreatedMetadata(value: unknown): value is SaleCreatedMetadata {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.totalAmount === 'string' &&
    typeof value.paymentMethod === 'string' &&
    typeof value.itemCount === 'number'
  )
}

function isStockReceiptCreatedMetadata(
  value: unknown,
): value is StockReceiptCreatedMetadata {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.supplierId === 'number' &&
    (typeof value.referenceNo === 'string' || value.referenceNo === null) &&
    typeof value.itemCount === 'number'
  )
}

function isStockAdjustmentCreatedMetadata(
  value: unknown,
): value is StockAdjustmentCreatedMetadata {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.productId === 'number' &&
    typeof value.quantityDelta === 'number' &&
    typeof value.reason === 'string' &&
    typeof value.movementType === 'string'
  )
}

function formatUnknownValue(value: unknown): string {
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

function formatMetadataKey(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')

  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

type MetadataRowProps = {
  label: string
  children: ReactNode
}

function MetadataRow({ label, children }: MetadataRowProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>

      <dd className="wrap-break-words text-sm font-medium text-secondary-foreground sm:text-right">
        {children}
      </dd>
    </div>
  )
}

export function AuditMetadataView({ log }: { log: AuditLog }) {
  if (log.action === 'SALE_CREATED' && isSaleCreatedMetadata(log.metadata)) {
    return (
      <dl className="space-y-3">
        <MetadataRow label="Payment method">{log.metadata.paymentMethod}</MetadataRow>

        <MetadataRow label="Items">{log.metadata.itemCount}</MetadataRow>

        <MetadataRow label="Total">
          {pesoFormatter.format(Number(log.metadata.totalAmount))}
        </MetadataRow>
      </dl>
    )
  }

  if (
    log.action === 'STOCK_RECEIPT_CREATED' &&
    isStockReceiptCreatedMetadata(log.metadata)
  ) {
    return (
      <dl className="space-y-3">
        <MetadataRow label="Supplier ID">{log.metadata.supplierId}</MetadataRow>

        <MetadataRow label="Items">{log.metadata.itemCount}</MetadataRow>

        <MetadataRow label="Reference">{log.metadata.referenceNo ?? 'None'}</MetadataRow>
      </dl>
    )
  }

  if (
    log.action === 'STOCK_ADJUSTMENT_CREATED' &&
    isStockAdjustmentCreatedMetadata(log.metadata)
  ) {
    return (
      <dl className="space-y-3">
        <MetadataRow label="Product ID">{log.metadata.productId}</MetadataRow>

        <MetadataRow label="Inventory change">
          <span
            className={
              log.metadata.quantityDelta > 0 ? 'text-success' : 'text-destructive'
            }
          >
            {log.metadata.quantityDelta > 0 ? '+' : ''}
            {log.metadata.quantityDelta}
          </span>
        </MetadataRow>

        <MetadataRow label="Movement type">{log.metadata.movementType}</MetadataRow>

        <MetadataRow label="Reason">{log.metadata.reason}</MetadataRow>
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
  if (isRecord(log.metadata)) {
    const entries = Object.entries(log.metadata)

    if (entries.length === 0) {
      return <p className="text-sm text-muted-foreground">No additional metadata.</p>
    }

    return (
      <dl className="space-y-3">
        {entries.map(([key, value]) => (
          <MetadataRow key={key} label={formatMetadataKey(key)}>
            {formatUnknownValue(value)}
          </MetadataRow>
        ))}
      </dl>
    )
  }

  return <p className="text-sm text-muted-foreground">No additional metadata.</p>
}
