import type { Product } from '../../types/product'
import { Badge, Button } from '../../components/ui'

type ProductCardProps = {
  product: Product
  selected?: boolean
  onSelect?: () => void
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
  selected = false,
  onSelect,
}: ProductCardProps) {
  const sellingPrice = Number(product.sellingPrice)

  return (
    <article
      className={[
        'rounded-lg border bg-card p-4',
        selected ? 'border-primary ring-1 ring-primary' : product.lowStock
          ? 'border-warning/30'
          : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">
            {product.name}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            SKU {product.sku}
          </p>
        </div>

        {product.lowStock && (
          <Badge variant={product.currentStock <= 0 ? 'danger' : 'warning'} className="shrink-0">
            {product.currentStock <= 0 ? 'Out of stock' : 'Low stock'}
          </Badge>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Price
          </p>

          <p className="mt-1 text-base font-semibold text-foreground">
            {pesoFormatter.format(sellingPrice)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In stock
          </p>

          <p
            className={[
              'mt-1 text-3xl font-semibold tabular-nums',
              product.lowStock
                ? 'text-warning'
                : 'text-foreground',
            ].join(' ')}
          >
            {product.currentStock}
          </p>
        </div>
      </div>
      {onSelect && (
        <Button variant="secondary" onClick={onSelect} aria-label={'View stock details for ' + product.name} aria-pressed={selected} className="mt-4 w-full text-ui">
          View stock details
        </Button>
      )}
    </article>
  )
}
