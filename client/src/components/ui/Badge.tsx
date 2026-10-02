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

const statusDotClasses: Partial<Record<BadgeVariant, string>> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
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
        'ui-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'text-xs font-medium',
        variantClasses[
          variant
        ],
        className,
      ].join(' ')}
      {...props}
    >
      {statusDotClasses[variant] && (
        <span aria-hidden="true" className={'size-1.5 shrink-0 rounded-full ' + statusDotClasses[variant]} />
      )}
      {children}
    </span>
  )
}
