import type { ReactNode } from 'react'

import { useAuth } from '../auth/useAuth'

export type AppView =
  | 'inventory'
  | 'sale'

type AppShellProps = {
  children: ReactNode
  activeView: AppView
  onNavigate: (view: AppView) => void
}

export function AppShell({
  children,
  activeView,
  onNavigate,
}: AppShellProps) {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const isOwner =
    user.role === 'OWNER'

  function navButtonClass(
    isActive: boolean,
  ) {
    return [
      'min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-600',
      isActive
        ? 'bg-emerald-700 text-white'
        : 'bg-white text-slate-700 hover:bg-slate-100',
    ].join(' ')
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-emerald-700">
              TindaTrack
            </p>

            <p className="truncate text-xs text-slate-500">
              {user.name} ·{' '}
              {user.role === 'OWNER'
                ? 'Owner'
                : 'Staff'}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="min-h-11 shrink-0 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            Sign out
          </button>
        </div>

        <nav
          aria-label="Main navigation"
          className="mx-auto flex w-full max-w-2xl gap-2 overflow-x-auto px-4 pb-3"
        >
          <button
            type="button"
            aria-current={
              activeView ===
              'inventory'
                ? 'page'
                : undefined
            }
            onClick={() =>
              onNavigate(
                'inventory',
              )
            }
            className={navButtonClass(
              activeView ===
                'inventory',
            )}
          >
            Inventory
          </button>

          <button
            type="button"
            aria-current={
              activeView === 'sale'
                ? 'page'
                : undefined
            }
            onClick={() =>
              onNavigate('sale')
            }
            className={navButtonClass(
              activeView === 'sale',
            )}
          >
            New Sale
          </button>

          {isOwner && (
            <>
              <button
                type="button"
                disabled
                title="Reports will be added in a later slice."
                className="min-h-11 shrink-0 rounded-xl px-4 text-sm font-medium text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reports
              </button>

              <button
                type="button"
                disabled
                title="Audit history will be added in a later slice."
                className="min-h-11 shrink-0 rounded-xl px-4 text-sm font-medium text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Audit
              </button>
            </>
          )}
        </nav>
      </header>

      {children}
    </div>
  )
}