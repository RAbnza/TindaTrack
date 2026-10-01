import type { Product } from '../../types/product'

type AvailableProductCardProps = {
  product: Product
  isInCart: boolean
  onAdd: (productId: number) => void
}

const pesoFormatter = new Intl.NumberFormat(
  'en-PH',
  {
    style: 'currency',
    currency: 'PHP',
  },
)

export function AvailableProductCard({
  product,
  isInCart,
  onAdd,
}: AvailableProductCardProps) {
  const isOutOfStock =
    product.currentStock <= 0

  const cannotAdd =
    isInCart ||
    isOutOfStock ||
    !product.active

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
        </div>

        <p className="shrink-0 text-base font-semibold text-slate-950">
          {pesoFormatter.format(
            Number(product.sellingPrice),
          )}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p
          className={[
            'text-sm font-medium',
            isOutOfStock
              ? 'text-red-700'
              : product.lowStock
                ? 'text-amber-700'
                : 'text-slate-600',
          ].join(' ')}
        >
          {isOutOfStock
            ? 'Out of stock'
            : `Stock: ${product.currentStock}`}
        </p>

        <button
          type="button"
          disabled={cannotAdd}
          onClick={() => onAdd(product.id)}
          className="min-h-11 min-w-20 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {isInCart
            ? 'Added'
            : isOutOfStock
              ? 'None'
              : 'Add'}
        </button>
      </div>
    </article>
  )
}