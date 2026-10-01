import {
  Link,
} from 'react-router-dom'

import {
  useAuth,
} from '../auth/useAuth'

import {
  useDashboard,
} from '../features/dashboard/useDashboard'

const pesoFormatter =
  new Intl.NumberFormat(
    'en-PH',
    {
      style: 'currency',
      currency: 'PHP',
    },
  )

function getGreeting(): string {
  const hour =
    new Date().getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

type MetricCardProps = {
  label: string
  value: string | number
}

function MetricCard({
  label,
  value,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">
        {value}
      </p>
    </div>
  )
}

type QuickLinkProps = {
  to: string
  children: string
}

function QuickLink({
  to,
  children,
}: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  )
}

export function DashboardPage() {
  const {
    user,
  } = useAuth()

  const {
    dashboard,
    isLoading,
    error,
    reload,
  } = useDashboard()

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12 text-center">
        <p className="text-sm text-slate-600">
          Loading dashboard...
        </p>
      </main>
    )
  }

  if (
    error ||
    !dashboard
  ) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p
            role="alert"
            className="text-sm text-red-800"
          >
            {error ??
              'Unable to load dashboard.'}
          </p>

          <button
            type="button"
            onClick={() =>
              void reload()
            }
            className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <section>
        <p className="text-sm font-medium text-emerald-700">
          Today
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-950">
          {getGreeting()}
          {user
            ? `, ${user.name}`
            : ''}
        </h1>
      </section>

      {dashboard.role ===
      'OWNER' ? (
        <section className="mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">
                Today's sales
              </p>

              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-950">
                {pesoFormatter.format(
                  Number(
                    dashboard
                      .metrics
                      .totalSalesAmount,
                  ),
                )}
              </p>
            </div>

            <MetricCard
              label="Transactions"
              value={
                dashboard.metrics
                  .salesCount
              }
            />

            <MetricCard
              label="Low stock"
              value={
                dashboard.metrics
                  .lowStockCount
              }
            />

            <MetricCard
              label="Out of stock"
              value={
                dashboard.metrics
                  .outOfStockCount
              }
            />

            <MetricCard
              label="Active products"
              value={
                dashboard.metrics
                  .activeProductCount
              }
            />

            <MetricCard
              label="Active staff"
              value={
                dashboard.metrics
                  .activeStaffCount
              }
            />
          </div>
        </section>
      ) : (
        <section className="mt-6">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Sales you've recorded"
              value={
                dashboard.metrics
                  .mySalesCount
              }
            />

            <MetricCard
              label="Low stock"
              value={
                dashboard.metrics
                  .lowStockCount
              }
            />

            <MetricCard
              label="Out of stock"
              value={
                dashboard.metrics
                  .outOfStockCount
              }
            />

            <MetricCard
              label="Active products"
              value={
                dashboard.metrics
                  .activeProductCount
              }
            />
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-950">
          Needs attention
        </h2>

        {dashboard
          .lowStockProducts
          .length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="font-medium text-slate-800">
              No low-stock
              products
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Nothing currently
              needs restocking
              attention.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {dashboard
              .lowStockProducts
              .map(
                (product) => (
                  <article
                    key={
                      product.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <h3 className="font-bold text-slate-950">
                      {
                        product.name
                      }
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        product.sku
                      }
                    </p>

                    <p className="mt-3 text-sm text-slate-700">
                      <span className="font-semibold">
                        {
                          product.currentStock
                        }
                      </span>{' '}
                      remaining ·
                      reorder at{' '}
                      <span className="font-semibold">
                        {
                          product.reorderLevel
                        }
                      </span>
                    </p>
                  </article>
                ),
              )}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-950">
          Quick actions
        </h2>

        {dashboard.role ===
        'OWNER' ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <QuickLink to="/sales/new">
              New Sale
            </QuickLink>

            <QuickLink to="/receiving">
              Receive Stock
            </QuickLink>

            <QuickLink to="/adjustments">
              Adjust Stock
            </QuickLink>

            <QuickLink to="/reports">
              Reports
            </QuickLink>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <QuickLink to="/sales/new">
              New Sale
            </QuickLink>

            <QuickLink to="/receiving">
              Receive Stock
            </QuickLink>

            <QuickLink to="/inventory">
              Inventory
            </QuickLink>
          </div>
        )}
      </section>
    </main>
  )
}