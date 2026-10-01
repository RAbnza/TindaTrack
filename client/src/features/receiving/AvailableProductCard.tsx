import type {
  Product,
} from '../../types/product'

type AvailableProductCardProps = {
  product: Product
  isInReceipt: boolean
  onAdd: (
    productId: number,
  ) => void
}

export function AvailableProductCard({
  product,
  isInReceipt,
  onAdd,
}: AvailableProductCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-950">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            SKU {product.sku}
          </p>

          <p className="mt-2 text-sm text-slate-600">
            Current stock:{' '}
            <span className="font-semibold text-slate-900">
              {product.currentStock}
            </span>
          </p>
        </div>

        <button
          type="button"
          disabled={
            isInReceipt ||
            !product.active
          }
          onClick={() =>
            onAdd(product.id)
          }
          className="min-h-11 min-w-20 shrink-0 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {isInReceipt
            ? 'Added'
            : 'Add'}
        </button>
      </div>
    </article>
  )
}