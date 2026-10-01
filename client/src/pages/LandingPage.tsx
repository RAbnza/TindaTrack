import {
  Link,
} from 'react-router-dom'

const capabilities = [
  {
    title:
      'Inventory truth',

    description:
      'Stock comes from receipts, sales, and traceable adjustments instead of an editable quantity.',
  },

  {
    title:
      'Fast sales',

    description:
      'Record multi-item sales while the server validates available stock and calculates authoritative totals.',
  },

  {
    title:
      'Stock receiving',

    description:
      'Record supplier deliveries and increase inventory through documented stock movements.',
  },

  {
    title:
      'Business history',

    description:
      'Review daily sales, stock movements, and important audited actions when you need to trace what happened.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              T
            </span>

            <span className="text-brand font-semibold tracking-tight">
              TindaTrack
            </span>
          </Link>

          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-center lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">
                Inventory & order management
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-[2.75rem] sm:leading-[1.12]">
                Keep inventory accurate.
                <span className="block text-secondary-foreground">
                  Record every stock change.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
                TindaTrack helps small
                retailers manage
                inventory, sales,
                receiving, and
                traceable stock history
                from one simple
                workspace.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Sign in
                </Link>

                <a
                  href="#capabilities"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  See what it does
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Store operations
                    </p>

                    <p className="mt-1 font-semibold text-foreground">
                      One inventory trail
                    </p>
                  </div>

                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    Traceable
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Stock receipt
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Supplier delivery
                      </p>
                    </div>

                    <span className="font-semibold tabular-nums text-success">
                      +24
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Sale
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Recorded transaction
                      </p>
                    </div>

                    <span className="font-semibold tabular-nums text-destructive">
                      -3
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Adjustment
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Reason required
                      </p>
                    </div>

                    <span className="font-semibold tabular-nums text-success">
                      +1
                    </span>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-5 text-muted-foreground">
                  Inventory changes are
                  represented by recorded
                  movements instead of a
                  manually edited stock
                  number.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="scroll-mt-6 bg-background"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">
                Core capabilities
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Everyday store
                operations without
                losing the history.
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                TindaTrack focuses on
                the workflows a small
                retailer needs to keep
                stock information
                useful and explainable.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {capabilities.map(
                (
                  capability,
                  index,
                ) => (
                  <article
                    key={
                      capability.title
                    }
                    className="rounded-xl border border-border bg-card p-5 sm:p-6"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-sm font-semibold tabular-nums text-accent-foreground">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </div>

                    <h3 className="mt-5 text-section font-semibold text-foreground">
                      {
                        capability.title
                      }
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      {
                        capability.description
                      }
                    </p>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
              <div>
                <p className="text-sm font-medium text-primary">
                  Role-aware workspace
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  Focused access for
                  owners and staff.
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  The workspace exposes
                  different operational
                  areas based on the
                  signed-in user's role.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-xl border border-border bg-background p-5">
                  <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    OWNER
                  </span>

                  <h3 className="mt-4 font-semibold text-foreground">
                    Store management
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Manage products,
                    suppliers, staff,
                    adjustments,
                    reports, stock
                    movements, and audit
                    history.
                  </p>
                </article>

                <article className="rounded-xl border border-border bg-background p-5">
                  <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                    STAFF
                  </span>

                  <h3 className="mt-4 font-semibold text-foreground">
                    Daily operations
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Record sales,
                    receive stock, and
                    work with current
                    inventory.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Ready to open the
                workspace?
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with an existing
                TindaTrack account.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            TindaTrack
          </p>

          <p>
            Inventory and order
            management for small retail
            operations.
          </p>
        </div>
      </footer>
    </div>
  )
}