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
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            SKU {product.sku}
          </p>

          <p className="mt-2 text-sm text-secondary-foreground">
            Current stock:{' '}
            <span className="font-semibold text-foreground">
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
          className="min-h-11 min-w-20 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled-foreground"
        >
          {isInReceipt
            ? 'Added'
            : 'Add'}
        </button>
      </div>
    </article>
  )
}
