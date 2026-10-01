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
        'w-full px-4 py-6 md:px-6 lg:px-8',
        className,
      ].join(' ')}
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl">
        {children}
      </div>
    </main>
  )
}