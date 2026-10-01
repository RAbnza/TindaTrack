import { Link } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../components/ui'
import { useDashboard } from '../features/dashboard/useDashboard'

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

type MetricCardProps = {
  label: string
  value: string | number
  description: string
  primary?: boolean
  tone?: 'neutral' | 'warning' | 'danger'
}

function MetricCard({
  label, value, description, primary = false, tone = 'neutral',
}: MetricCardProps) {
  const valueColor = tone === 'warning'
    ? 'text-warning'
    : tone === 'danger'
      ? 'text-destructive'
      : primary ? 'text-accent-foreground' : 'text-foreground'

  return (
    <Card className={[
      'min-w-0 rounded-xl border-border/60 p-4 sm:p-5',
      primary ? 'bg-accent/40 sm:p-6' : '',
    ].join(' ')}>
      <h2 className="text-sm font-medium text-secondary-foreground">{label}</h2>
      <p className={[
        'mt-3 break-words font-semibold tracking-tight tabular-nums',
        primary ? 'text-3xl sm:text-4xl' : 'text-2xl',
        valueColor,
      ].join(' ')}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </Card>
  )
}

type QuickLinkProps = {
  to: string
  children: string
  primary?: boolean
}

function QuickLink({ to, children, primary = false }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className={[
        'inline-flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium',
        'transition-colors motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        primary
          ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
          : 'border border-border bg-card text-secondary-foreground hover:bg-secondary',
      ].join(' ')}
    >
      {children}
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 shrink-0">
        <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { dashboard, isLoading, error, reload } = useDashboard()
  const pageHeader = (
    <PageHeader
      title="Dashboard"
      description="Today's store overview"
      actions={<Badge variant="primary">Today</Badge>}
    />
  )

  if (isLoading) {
    return (
      <PageContainer>
        {pageHeader}
        <Card className="mt-6 rounded-xl border-border/60">
          <LoadingState label="Loading dashboard..." />
        </Card>
      </PageContainer>
    )
  }

  if (error || !dashboard) {
    return (
      <PageContainer>
        {pageHeader}
        <div className="mt-6">
          <ErrorState message={error ?? 'Unable to load dashboard.'} onRetry={() => void reload()} />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {pageHeader}
      <p className="mt-4 break-words text-sm text-muted-foreground">
        {getGreeting()}{user ? ', ' + user.name : ''}.
        {' '}Here's how your store is doing today.
      </p>

      <section aria-label="Store metrics" className="mt-6 space-y-3 sm:space-y-4">
        {dashboard.role === 'OWNER' ? (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:gap-4">
            <MetricCard
              primary
              label="Today's sales"
              value={pesoFormatter.format(Number(dashboard.metrics.totalSalesAmount))}
              description="Total sales recorded today"
            />
            <MetricCard
              label="Transactions"
              value={dashboard.metrics.salesCount}
              description="Sales completed today"
            />
          </div>
        ) : (
          <MetricCard
            primary
            label="Sales you've recorded"
            value={dashboard.metrics.mySalesCount}
            description="Your completed transactions today"
          />
        )}

        <div className={[
          'grid grid-cols-2 gap-3 sm:gap-4',
          dashboard.role === 'OWNER' ? 'xl:grid-cols-4' : 'lg:grid-cols-3',
        ].join(' ')}>
          <MetricCard
            label="Low stock"
            value={dashboard.metrics.lowStockCount}
            description="Running low on stock"
            tone={dashboard.metrics.lowStockCount > 0 ? 'warning' : 'neutral'}
          />
          <MetricCard
            label="Out of stock"
            value={dashboard.metrics.outOfStockCount}
            description="Need replenishing"
            tone={dashboard.metrics.outOfStockCount > 0 ? 'danger' : 'neutral'}
          />
          <MetricCard
            label="Active products"
            value={dashboard.metrics.activeProductCount}
            description="In your product catalog"
          />
          {dashboard.role === 'OWNER' && (
            <MetricCard
              label="Active staff"
              value={dashboard.metrics.activeStaffCount}
              description="On your store team"
            />
          )}
        </div>
      </section>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="attention-heading" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="attention-heading" className="text-base font-semibold tracking-tight">Needs attention</h2>
            <Badge>{dashboard.lowStockProducts.length} products</Badge>
          </div>
          {dashboard.lowStockProducts.length === 0 ? (
            <EmptyState
              title="No low-stock products"
              description="Nothing currently needs restocking attention."
            />
          ) : (
            <Card className="overflow-hidden rounded-xl border-border/60">
              <ul className="divide-y divide-border/60">
                {dashboard.lowStockProducts.map((product) => {
                  const outOfStock = product.currentStock <= 0

                  return (
                    <li key={product.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 basis-36">
                          <h3 className="break-words text-sm font-semibold">{product.name}</h3>
                          <p className="mt-1 break-all text-xs text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                        <Badge variant={outOfStock ? 'danger' : 'warning'}>
                          {outOfStock ? 'Out of stock' : 'Low stock'}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Current stock</dt>
                          <dd className="mt-1 font-semibold tabular-nums text-secondary-foreground">{product.currentStock}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Reorder level</dt>
                          <dd className="mt-1 font-semibold tabular-nums text-secondary-foreground">{product.reorderLevel}</dd>
                        </div>
                      </dl>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </section>

        <section aria-labelledby="actions-heading" className="min-w-0">
          <h2 id="actions-heading" className="mb-3 text-base font-semibold tracking-tight">Quick actions</h2>
          <Card className="rounded-xl border-border/60 p-4 sm:p-5">
            <p className="mb-4 text-xs leading-5 text-muted-foreground">Keep your store moving.</p>
            <div className="grid gap-3">
              <QuickLink to="/sales/new" primary>New Sale</QuickLink>
              <QuickLink to="/receiving">Receive Stock</QuickLink>
              {dashboard.role === 'OWNER' ? (
                <>
                  <QuickLink to="/adjustments">Adjust Stock</QuickLink>
                  <QuickLink to="/reports">Reports</QuickLink>
                </>
              ) : (
                <QuickLink to="/inventory">Inventory</QuickLink>
              )}
            </div>
          </Card>
        </section>
      </div>
    </PageContainer>
  )
}
