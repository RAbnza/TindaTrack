import {
  NavLink,
} from 'react-router-dom'

import {
  useAuth,
} from '../auth/useAuth'

import type {
  ReactNode,
} from 'react'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({
  children,
}: AppShellProps) {
  const {
    user,
    logout,
  } = useAuth()

  if (!user) {
    return null
  }

  const isOwner =
    user.role === 'OWNER'

  function navLinkClass(
    isActive: boolean,
  ) {
    return [
      'flex min-h-11 shrink-0 items-center rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-600',
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
              {user.role ===
              'OWNER'
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
          <NavLink
            to="/inventory"
            className={({
              isActive,
            }) =>
              navLinkClass(
                isActive,
              )
            }
          >
            Inventory
          </NavLink>

          {isOwner && (
            <NavLink
              to="/products"
              className={({
                isActive,
              }) =>
                navLinkClass(
                  isActive,
                )
              }
            >
              Products
            </NavLink>
          )}

          {isOwner && (
            <NavLink
              to="/suppliers"
              className={({
                isActive,
              }) =>
                navLinkClass(
                  isActive,
                )
              }
            >
              Suppliers
            </NavLink>
          )}

          <NavLink
            to="/sales/new"
            className={({
              isActive,
            }) =>
              navLinkClass(
                isActive,
              )
            }
          >
            New Sale
          </NavLink>

          <NavLink
            to="/receiving"
            className={({
              isActive,
            }) =>
              navLinkClass(
                isActive,
              )
            }
          >
            Receive Stock
          </NavLink>

          {isOwner && (
            <NavLink
              to="/adjustments"
              className={({
                isActive,
              }) =>
                navLinkClass(
                  isActive,
                )
              }
            >
              Adjust Stock
            </NavLink>
          )}

          {isOwner && (
            <NavLink
              to="/reports"
              className={({
                isActive,
              }) =>
                navLinkClass(
                  isActive,
                )
              }
            >
              Reports
            </NavLink>
          )}

          {isOwner && (
            <NavLink
              to="/movements"
              className={({
                isActive,
              }) =>
                navLinkClass(
                  isActive,
                )
              }
            >
              Movements
            </NavLink>
          )}

          {isOwner && (
            <NavLink
              to="/audit"
              className={({
                isActive,
              }) =>
                navLinkClass(
                  isActive,
                )
              }
            >
              Audit
            </NavLink>
          )}
        </nav>
      </header>

      {children}
    </div>
  )
}