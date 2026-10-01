import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

type CardProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode
    surface?: 'default' | 'tint' | 'accent'
  }

export function Card({
  children,
  className = '',
  surface = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-border text-card-foreground',
        surface === 'accent' ? 'bg-accent' : surface === 'tint' ? 'bg-surface-tint' : 'bg-card',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
