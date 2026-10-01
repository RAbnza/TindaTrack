import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

type BadgeProps =
  HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant
    children: ReactNode
  }

const variantClasses: Record<
  BadgeVariant,
  string
> = {
  neutral:
    'bg-secondary text-secondary-foreground',

  primary:
    'bg-accent text-accent-foreground',

  success:
    'bg-success-soft text-success',

  warning:
    'bg-warning-soft text-warning',

  danger:
    'bg-destructive-soft text-destructive',

  info:
    'bg-info-soft text-info',
}

export function Badge({
  variant = 'neutral',
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-lg px-2.5 py-1',
        'text-xs font-medium',
        variantClasses[
          variant
        ],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}