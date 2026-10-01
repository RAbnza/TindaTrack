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
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            SKU {product.sku}
          </p>
        </div>

        <p className="shrink-0 text-base font-semibold text-foreground">
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
              ? 'text-destructive'
              : product.lowStock
                ? 'text-warning'
                : 'text-secondary-foreground',
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
          className="min-h-11 min-w-20 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled-foreground"
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
