import type {
  Product,
} from '../../types/product'

type ReceiptItemCardProps = {
  product: Product
  quantity: number
  unitCost: string
  unitCostError: string | null
  onDecrease: () => void
  onIncrease: () => void
  onUnitCostChange: (
    value: string,
  ) => void
  onRemove: () => void
}

export function ReceiptItemCard({
  product,
  quantity,
  unitCost,
  unitCostError,
  onDecrease,
  onIncrease,
  onUnitCostChange,
  onRemove,
}: ReceiptItemCardProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {product.name}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          SKU {product.sku}
        </p>

        <p className="mt-1 text-sm text-secondary-foreground">
          Current stock:{' '}
          {product.currentStock}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-secondary-foreground">
          Quantity
        </p>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease ${product.name} received quantity`}
            disabled={quantity <= 1}
            onClick={onDecrease}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-input bg-card text-xl font-medium text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>

          <span className="min-w-12 text-center text-lg font-semibold tabular-nums text-foreground">
            {quantity}
          </span>

          <button
            type="button"
            aria-label={`Increase ${product.name} received quantity`}
            onClick={onIncrease}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-input bg-card text-xl font-medium text-secondary-foreground"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor={`unit-cost-${product.id}`}
          className="block text-sm font-medium text-secondary-foreground"
        >
          Unit cost
        </label>

        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            ₱
          </span>

          <input
            id={`unit-cost-${product.id}`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={unitCost}
            onChange={(event) =>
              onUnitCostChange(
                event.target.value,
              )
            }
            placeholder="55.00"
            aria-invalid={
              unitCostError
                ? true
                : undefined
            }
            className={[
              'min-h-12 w-full rounded-lg border bg-card py-2 pl-9 pr-4 text-base text-foreground outline-none focus:ring-2',
              unitCostError
                ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
                : 'border-input focus:border-primary focus:ring-ring/20',
            ].join(' ')}
          />
        </div>

        {unitCostError && (
          <p
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {unitCostError}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="mt-5 min-h-11 rounded-lg border border-destructive/20 px-4 text-sm font-medium text-secondary-foreground hover:bg-destructive-soft"
      >
        Remove
      </button>
    </article>
  )
}
