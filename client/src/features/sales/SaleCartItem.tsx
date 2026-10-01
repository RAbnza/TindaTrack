import type { Product } from '../../types/product'

type SaleCartItemProps = {
  product: Product
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
}

const pesoFormatter = new Intl.NumberFormat(
  'en-PH',
  {
    style: 'currency',
    currency: 'PHP',
  },
)

export function SaleCartItem({
  product,
  quantity,
  onDecrease,
  onIncrease,
  onRemove,
}: SaleCartItemProps) {
  const sellingPrice =
    Number(product.sellingPrice)

  const displayedLineTotal =
    sellingPrice * quantity

  const exceedsCurrentStock =
    quantity > product.currentStock

  return (
    <article
      className={[
        'rounded-lg border bg-card p-4',
        exceedsCurrentStock
          ? 'border-destructive/30'
          : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-secondary-foreground">
            {pesoFormatter.format(
              sellingPrice,
            )}{' '}
            × {quantity}
          </p>
        </div>

        <p className="shrink-0 text-base font-semibold text-foreground">
          {pesoFormatter.format(
            displayedLineTotal,
          )}
        </p>
      </div>

      {exceedsCurrentStock && (
        <div
          role="alert"
          className="mt-3 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-secondary-foreground"
        >
          Only {product.currentStock}{' '}
          currently in stock. Reduce the
          quantity or remove this item.
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease ${product.name} quantity`}
            disabled={quantity <= 1}
            onClick={onDecrease}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-input bg-card text-xl font-medium text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>

          <span
            aria-label={`${product.name} quantity`}
            className="min-w-10 text-center text-lg font-semibold tabular-nums text-foreground"
          >
            {quantity}
          </span>

          <button
            type="button"
            aria-label={`Increase ${product.name} quantity`}
            disabled={
              quantity >= product.currentStock
            }
            onClick={onIncrease}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-input bg-card text-xl font-medium text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="min-h-11 rounded-lg border border-destructive/20 px-4 text-sm font-medium text-secondary-foreground hover:bg-destructive-soft focus:outline-none focus:ring-2 focus:ring-destructive"
        >
          Remove
        </button>
      </div>
    </article>
  )
}
