import type { Product } from '../../types/product'
import { Button } from '../../components/ui'
import { FormField, Input } from '../../components/ui/Field'
import { QuantityControl } from '../../components/ui/QuantityControl'

type ReceiptItemCardProps = {
  product: Product
  quantity: number
  unitCost: string
  unitCostError: string | null
  onDecrease: () => void
  onIncrease: () => void
  onQuantityChange: (quantity: number) => void
  onUnitCostChange: (value: string) => void
  onRemove: () => void
}
export function ReceiptItemCard({
  product,
  quantity,
  unitCost,
  unitCostError,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onUnitCostChange,
  onRemove,
}: ReceiptItemCardProps) {
  const errorId = `cost-error-${product.id}`
  return (
    <article className="selected-item-row">
      <h3 className="break-words font-semibold">{product.name}</h3>
      <p className="text-caption text-muted-foreground">
        {product.sku} · {product.currentStock} currently in stock
      </p>
      <div className="selected-item-fields">
        <div>
          <p className="mb-2 text-ui font-medium">Quantity</p>
          <QuantityControl
            label={`${product.name} received quantity`}
            value={quantity}
            onDecrease={onDecrease}
            onIncrease={onIncrease}
            onChange={onQuantityChange}
          />
        </div>
        <div className="cost-field">
          <FormField label="Unit cost" id={`unit-cost-${product.id}`}>
            <Input
              id={`unit-cost-${product.id}`}
              aria-describedby={unitCostError ? errorId : undefined}
              aria-invalid={Boolean(unitCostError)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="₱ 0.00"
              value={unitCost}
              onChange={(e) => onUnitCostChange(e.target.value)}
            />
          </FormField>
        </div>
        <Button variant="ghost" aria-label={`Remove ${product.name}`} onClick={onRemove}>
          Remove
        </Button>
      </div>
      {unitCostError && (
        <p id={errorId} role="alert" className="mt-2 text-ui text-destructive">
          {unitCostError}
        </p>
      )}
      {(!Number.isInteger(quantity) || quantity < 1 || !product.active) && (
        <p role="alert" className="mt-2 text-ui text-destructive">
          Use an active product and a positive whole quantity.
        </p>
      )}
    </article>
  )
}
