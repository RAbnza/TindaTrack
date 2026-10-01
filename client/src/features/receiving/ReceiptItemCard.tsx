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
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-950">
          {product.name}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          SKU {product.sku}
        </p>

        <p className="mt-1 text-sm text-slate-600">
          Current stock:{' '}
          {product.currentStock}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-800">
          Quantity
        </p>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease ${product.name} received quantity`}
            disabled={quantity <= 1}
            onClick={onDecrease}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>

          <span className="min-w-12 text-center text-lg font-bold tabular-nums text-slate-950">
            {quantity}
          </span>

          <button
            type="button"
            aria-label={`Increase ${product.name} received quantity`}
            onClick={onIncrease}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-800"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor={`unit-cost-${product.id}`}
          className="block text-sm font-medium text-slate-800"
        >
          Unit cost
        </label>

        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
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
              'min-h-12 w-full rounded-xl border bg-white py-2 pl-9 pr-4 text-base text-slate-950 outline-none focus:ring-2',
              unitCostError
                ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100',
            ].join(' ')}
          />
        </div>

        {unitCostError && (
          <p
            role="alert"
            className="mt-2 text-sm text-red-700"
          >
            {unitCostError}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="mt-5 min-h-11 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        Remove
      </button>
    </article>
  )
}