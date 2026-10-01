import type { ReactNode } from 'react'

import { BrandMark } from '../BrandMark'
import { Card } from '../ui'

type AuthPageLayoutProps = {
  children: ReactNode
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f7f9] px-4 py-8 text-foreground sm:py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-7 flex items-center justify-center gap-3">
          <BrandMark />
          <div>
            <p className="text-[17px] font-semibold tracking-[-0.04em]">
              TindaTrack
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Store operations
            </p>
          </div>
        </div>

        <Card className="rounded-xl border-border/60 p-6 shadow-[0_4px_24px_rgba(27,27,31,0.03)] sm:p-8">
          {children}
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Inventory <span aria-hidden="true">&middot;</span> Sales{' '}
          <span aria-hidden="true">&middot;</span> Stock history
        </p>
      </div>
    </main>
  )
}
