import { Link } from 'react-router-dom'
import { AppIcon, type AppIconName } from '../components/AppIcon'
import { BrandMark } from '../components/BrandMark'
import { Badge, Card, IconTile } from '../components/ui'

const capabilities: Array<{
  icon: AppIconName
  title: string
  description: string
}> = [
  {
    icon: 'inventory',
    title: 'Inventory truth',
    description:
      'Know what is on hand. Every receipt, sale, and adjustment leaves a recorded stock movement.',
  },
  {
    icon: 'sale',
    title: 'Fast sales',
    description:
      'Record multi-item sales with available-stock checks, clear totals, and a transaction receipt.',
  },
  {
    icon: 'receiving',
    title: 'Stock receiving',
    description:
      'Record supplier deliveries and keep the quantities and costs together with each receipt.',
  },
  {
    icon: 'audit',
    title: 'Business history',
    description:
      'Review daily sales, stock movements, and audited actions to understand what happened.',
  },
]

export function LandingPage() {
  return (
    <div className="public-page min-h-dvh text-foreground">
      <header className="public-header border-b border-border">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <BrandMark />
            <span className="text-brand font-semibold tracking-tight">
              TindaTrack
            </span>
          </Link>
          <Link to="/login" className="action-link action-link-primary">
            Sign in <AppIcon name="arrow-right" />
          </Link>
        </div>
      </header>
      <main>
        <section className="public-hero">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
            <div>
              <p className="hero-eyebrow text-caption font-medium text-primary">
                <AppIcon name="inventory" />
                Inventory &amp; order management
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-[3.25rem] sm:leading-[1.12]">
                Keep inventory accurate.
                <span className="mt-2 block text-primary">
                  Record every stock change.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
                Your inventory, sales, and supplier deliveries in one clear
                workspace. Built for the everyday work of running a small retail
                store.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="action-link action-link-primary min-h-12 px-5"
                >
                  Sign in <AppIcon name="arrow-right" />
                </Link>
                <a
                  href="#capabilities"
                  className="action-link action-link-secondary min-h-12 px-5"
                >
                  See what it does <AppIcon name="chevron-down" />
                </a>
              </div>
              <p className="mt-6 flex items-center gap-2 text-caption text-secondary-foreground">
                <AppIcon name="movements" />
                One workspace. A traceable stock history.
              </p>
            </div>
            <div className="public-preview">
              <div className="public-preview-window">
                <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-tint px-5 py-4">
                  <span className="flex items-center gap-2 text-ui font-semibold">
                    <AppIcon name="dashboard" />
                    Store workspace
                  </span>
                  <Badge variant="primary">Preview</Badge>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <IconTile icon="movements" />
                    <div>
                      <p className="text-caption text-muted-foreground">
                        Example stock trail
                      </p>
                      <h2 className="mt-0.5 text-section font-semibold">
                        One inventory trail
                      </h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        icon: 'receiving' as const,
                        title: 'Stock receipt',
                        subtitle: 'Supplier delivery',
                        amount: '+24',
                        positive: true,
                      },
                      {
                        icon: 'sale' as const,
                        title: 'Sale',
                        subtitle: 'Recorded transaction',
                        amount: '−3',
                        positive: false,
                      },
                      {
                        icon: 'adjustment' as const,
                        title: 'Adjustment',
                        subtitle: 'Reason required',
                        amount: '+1',
                        positive: true,
                      },
                    ].map(({ icon, title, subtitle, amount, positive }) => (
                      <div
                        key={title}
                        className="flex items-center gap-3 rounded-xl border border-border bg-surface-tint px-4 py-3"
                      >
                        <AppIcon name={icon} className="text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{title}</p>
                          <p className="mt-0.5 text-caption text-muted-foreground">
                            {subtitle}
                          </p>
                        </div>
                        <span
                          className={`text-lg font-semibold tabular-nums ${positive ? 'text-success' : 'text-destructive'}`}
                        >
                          {amount}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 flex items-start gap-2 text-caption leading-5 text-muted-foreground">
                    <AppIcon name="audit" />
                    Stock changes stay connected to their recorded movements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="capabilities"
          className="scroll-mt-6 border-y border-border bg-card/70"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-caption font-semibold uppercase tracking-widest text-primary">
                Core capabilities
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Everyday operations.
                <br />A clear record of every change.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The tools a small retailer needs to keep stock information
                useful and explainable.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon, title, description }) => (
                <Card key={title} className="public-feature p-5 sm:p-6">
                  <IconTile icon={icon} />
                  <h3 className="mt-5 text-section font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section>
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:px-8 lg:py-20">
            <div>
              <p className="text-caption font-semibold uppercase tracking-widest text-primary">
                Role-aware workspace
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Focused access for
                <br />
                owners and staff.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                Each person sees the operational areas available to their
                account.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <IconTile icon="shield" />
                  <Badge variant="primary">OWNER</Badge>
                </div>
                <h3 className="mt-5 text-section font-semibold">
                  Store management
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Manage products, suppliers, staff, adjustments, reports, stock
                  movements, and audit history.
                </p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <IconTile icon="staff" tone="info" />
                  <Badge>STAFF</Badge>
                </div>
                <h3 className="mt-5 text-section font-semibold">
                  Daily operations
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Record sales, receive stock, and work with current inventory.
                </p>
              </Card>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="public-cta flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready to open your workspace?
              </h2>
              <p className="mt-2 text-sm text-secondary-foreground">
                Sign in with your existing TindaTrack account.
              </p>
            </div>
            <Link
              to="/login"
              className="action-link action-link-primary min-h-12 shrink-0 px-5"
            >
              Sign in <AppIcon name="arrow-right" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-card/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <AppIcon name="inventory" />
            TindaTrack
          </span>
          <p>Inventory and order management for small retail operations.</p>
        </div>
      </footer>
    </div>
  )
}
