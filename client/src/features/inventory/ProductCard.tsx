import type { Product } from '../../types/product'
import { Badge, Button } from '../../components/ui'
import { IconTile } from '../../components/ui/IconTile'
import { AppIcon } from '../../components/AppIcon'

type ProductCardProps = {
  product: Product
  selected?: boolean
  onSelect?: () => void
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

export function ProductCard({
  product,
  selected = false,
  onSelect,
}: ProductCardProps) {
  const sellingPrice = Number(product.sellingPrice)

  return (
    <article
      data-selected={selected}
      className={[
        'inventory-item border bg-card p-4 sm:p-5',
        selected
          ? 'border-primary ring-1 ring-primary'
          : product.lowStock
            ? 'border-warning/30'
            : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <IconTile
            icon="inventory"
            tone={
              product.lowStock
                ? product.currentStock <= 0
                  ? 'danger'
                  : 'warning'
                : 'primary'
            }
          />
          <div className="min-w-0">
            <h2 className="wrap-break-words text-sm font-semibold text-foreground">
              {product.name}
            </h2>

            <p className="mt-1 break-all text-caption text-muted-foreground">
              SKU {product.sku}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {product.category && (
          <p className="text-caption text-muted-foreground">
            {product.category}
          </p>
        )}
        {product.lowStock && (
          <Badge
            variant={product.currentStock <= 0 ? 'danger' : 'warning'}
            className="shrink-0"
          >
            {product.currentStock <= 0 ? 'Out of stock' : 'Low stock'}
          </Badge>
        )}
      </div>

      <div className="product-quantities mt-4 grid grid-cols-2 items-end gap-4">
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
              'mt-1 text-2xl font-semibold tabular-nums',
              product.currentStock <= 0
                ? 'text-destructive'
                : product.lowStock
                  ? 'text-warning'
                  : 'text-foreground',
            ].join(' ')}
          >
            {product.currentStock}
          </p>
        </div>
      </div>
      {onSelect && (
        <Button
          variant="secondary"
          onClick={onSelect}
          aria-label={'View stock details for ' + product.name}
          aria-pressed={selected}
          className="mt-4 w-full text-ui"
        >
          <AppIcon name={selected ? 'check' : 'info'} />
          View stock details
          <AppIcon name="arrow-right" className="ml-auto size-4" />
        </Button>
      )}
    </article>
  )
}
