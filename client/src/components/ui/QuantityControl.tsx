import { Button } from './Button'
import { Input } from './Field'
export function QuantityControl({
  label,
  value,
  onDecrease,
  onIncrease,
  onChange,
  max,
}: {
  label: string
  value: number
  onDecrease: () => void
  onIncrease: () => void
  onChange?: (value: number) => void
  max?: number
}) {
  return (
    <div className="quantity-control inline-flex items-center gap-1">
      <Button
        variant="secondary"
        className="min-w-11 px-2"
        aria-label={`Decrease ${label}`}
        disabled={value <= 1}
        onClick={onDecrease}
      >
        −
      </Button>
      {onChange ? (
        <Input
          aria-label={label}
          type="number"
          min={1}
          max={max}
          step={1}
          className="w-20 text-center tabular-nums"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ) : (
        <span
          aria-label={label}
          className="min-w-10 text-center font-semibold tabular-nums"
        >
          {value}
        </span>
      )}
      <Button
        variant="secondary"
        className="min-w-11 px-2"
        aria-label={`Increase ${label}`}
        disabled={max !== undefined && value >= max}
        onClick={onIncrease}
      >
        +
      </Button>
    </div>
  )
}
