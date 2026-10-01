import type { ReactNode } from 'react'

import { BrandMark } from '../BrandMark'
import { Card } from '../ui'

type AuthPageLayoutProps = {
  children: ReactNode
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-foreground sm:py-12">
      <div className="w-full max-w-110">
        <div className="mb-7 flex items-center justify-center gap-3">
          <BrandMark />
          <div>
            <p className="text-brand font-semibold tracking-tight">
              TindaTrack
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Store operations
            </p>
          </div>
        </div>

        <Card className="p-6 shadow-(--surface-shadow) sm:p-8">
          {children}
        </Card>

        <p className="mt-6 text-center text-caption text-secondary-foreground">
          Inventory <span aria-hidden="true">&middot;</span> Sales{' '}
          <span aria-hidden="true">&middot;</span> Stock history
        </p>
      </div>
    </main>
  )
}
