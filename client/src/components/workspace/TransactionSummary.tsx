import { useId, useState, type ReactNode } from 'react'
export function TransactionSummary({
  title,
  count,
  quantity,
  total,
  totalLabel = 'Estimated total',
  children,
  issues,
  action,
}: {
  title: string
  count: number
  quantity: number
  total?: string
  totalLabel?: string
  children?: ReactNode
  issues?: ReactNode
  action: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  return (
    <section aria-label="Transaction summary">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-section font-semibold">{title}</h2>
        <button
          type="button"
          className="summary-toggle min-h-11 text-ui font-medium text-primary"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Hide details' : 'Details'}
        </button>
      </div>
      <p className="text-ui text-secondary-foreground">
        {count} {count === 1 ? 'item' : 'items'} · {quantity} units
      </p>
      <div id={detailsId} className="summary-details" data-expanded={expanded}>
        {children}
      </div>
      {total && (
        <div className="summary-total">
          <span className="text-ui text-secondary-foreground">{totalLabel}</span>
          <strong>{total}</strong>
        </div>
      )}
      {issues && (
        <div role="status" className="summary-help">
          {issues}
        </div>
      )}
      <div className="mt-3">{action}</div>
    </section>
  )
}
