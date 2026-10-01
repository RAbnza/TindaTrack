import type { Product } from '../../types/product'

type ProductCardProps = {
  product: Product
}

const pesoFormatter = new Intl.NumberFormat(
  'en-PH',
  {
    style: 'currency',
    currency: 'PHP',
  },
)

export function ProductCard({
  product,
}: ProductCardProps) {
  const sellingPrice = Number(product.sellingPrice)

  return (
    <article
      className={[
        'rounded-2xl border bg-white p-4',
        product.lowStock
          ? 'border-amber-300'
          : 'border-slate-200',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-950">
            {product.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            SKU {product.sku}
          </p>
        </div>

        {product.lowStock && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
            Low stock
          </span>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Price
          </p>

          <p className="mt-1 text-base font-semibold text-slate-900">
            {pesoFormatter.format(sellingPrice)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            In stock
          </p>

          <p
            className={[
              'mt-1 text-3xl font-bold tabular-nums',
              product.lowStock
                ? 'text-amber-700'
                : 'text-slate-950',
            ].join(' ')}
          >
            {product.currentStock}
          </p>
        </div>
      </div>
    </article>
  )
}