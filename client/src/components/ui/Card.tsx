import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

type CardProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode
  }

export function Card({
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-border bg-card text-card-foreground',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
