import type { ReactNode } from 'react'

import { BrandMark } from '../BrandMark'
import { IconTile } from '../ui'

type AuthPageLayoutProps = {
  children: ReactNode
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className="auth-page flex min-h-dvh items-center justify-center px-4 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="auth-frame">
        <div className="auth-brand">
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

        <div className="auth-composition">
          <aside className="auth-story" aria-label="About your workspace">
            <div>
              <IconTile icon="inventory" className="mb-6" />
              <p className="text-caption font-semibold uppercase tracking-widest text-primary">
                Your daily workspace
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
                A clear view of
                <br />
                your store.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-7 text-secondary-foreground">
                Keep inventory, sales, and stock movements together. Give every
                change a clear record.
              </p>
            </div>
            <div className="space-y-5">
              {[
                {
                  icon: 'inventory' as const,
                  title: 'Know what is in stock',
                  text: 'Current quantities and restocking priorities.',
                },
                {
                  icon: 'sale' as const,
                  title: 'Keep daily work moving',
                  text: 'Sales and supplier deliveries in one place.',
                },
                {
                  icon: 'audit' as const,
                  title: 'Follow the stock trail',
                  text: 'Recorded movements and transaction history.',
                },
              ].map(({ icon, title, text }) => (
                <div className="flex items-start gap-3" key={title}>
                  <IconTile icon={icon} />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-caption leading-5 text-secondary-foreground">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
          <div className="auth-form-surface">{children}</div>
        </div>

        <p className="mt-6 text-center text-caption text-secondary-foreground">
          Inventory <span aria-hidden="true">&middot;</span> Sales{' '}
          <span aria-hidden="true">&middot;</span> Stock history
        </p>
      </div>
    </main>
  )
}
