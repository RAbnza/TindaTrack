import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    loading?: boolean
    children: ReactNode
  }

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary: [
    'bg-primary',
    'text-primary-foreground',
    'hover:bg-primary-hover',
    'focus-visible:ring-ring',
  ].join(' '),

  secondary: [
    'border',
    'border-border',
    'bg-card',
    'text-secondary-foreground',
    'hover:bg-secondary',
    'focus-visible:ring-ring',
  ].join(' '),

  danger: [
    'bg-destructive',
    'text-destructive-foreground',
    'hover:opacity-90',
    'focus-visible:ring-destructive',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-secondary-foreground',
    'hover:bg-secondary',
    'focus-visible:ring-ring',
  ].join(' '),
}

export const Button =
  forwardRef<
    HTMLButtonElement,
    ButtonProps
  >(
    function Button(
      {
        variant = 'primary',
        loading = false,
        disabled,
        className = '',
        type = 'button',
        children,
        ...props
      },
      ref,
    ) {
      const isDisabled =
        disabled || loading

      return (
        <button
          ref={ref}
          type={type}
          disabled={
            isDisabled
          }
          aria-busy={
            loading ||
            undefined
          }
          className={[
            'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2',
            'text-sm font-medium',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'focus-visible:ring-offset-background',
            'disabled:pointer-events-none disabled:opacity-50',
            variantClasses[
              variant
            ],
            className,
          ].join(' ')}
          {...props}
        >
          {loading && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            />
          )}

          {children}
        </button>
      )
    },
  )