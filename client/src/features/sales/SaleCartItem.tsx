import type { Product } from '../../types/product'
import { Button } from '../../components/ui'
import { QuantityControl } from '../../components/ui/QuantityControl'

type SaleCartItemProps = {
  product: Product
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}
const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
export function SaleCartItem({
  product,
  quantity,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onRemove,
}: SaleCartItemProps) {
  const invalid =
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > product.currentStock ||
    !product.active
  return (
    <article className="selected-item-row">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold">{product.name}</h3>
          <p className="text-caption text-muted-foreground">
            {product.sku} · {product.currentStock} in stock
          </p>
          <p className="text-ui text-secondary-foreground">
            {peso.format(Number(product.sellingPrice))} per unit
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">
          {peso.format(Number(product.sellingPrice) * quantity)}
        </p>
      </div>
      <div className="selected-item-fields">
        <QuantityControl
          label={`${product.name} quantity`}
          value={quantity}
          max={product.currentStock}
          onDecrease={onDecrease}
          onIncrease={onIncrease}
          onChange={onQuantityChange}
        />
        <Button variant="ghost" onClick={onRemove} aria-label={`Remove ${product.name}`}>
          Remove
        </Button>
      </div>
      {invalid && (
        <p role="alert" className="mt-2 text-ui text-destructive">
          Enter a positive whole quantity. Only {product.currentStock} currently in stock.
        </p>
      )}
    </article>
  )
}
