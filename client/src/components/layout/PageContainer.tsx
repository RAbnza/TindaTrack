import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

type PageContainerProps =
  HTMLAttributes<HTMLElement> & {
    children: ReactNode
  }

export function PageContainer({
  children,
  className = '',
  ...props
}: PageContainerProps) {
  return (
    <main
      className={[
        'page-container',
        className,
      ].join(' ')}
      {...props}
    >
      <div className="page-content">
        {children}
      </div>
    </main>
  )
}
