import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  NavLink,
  useLocation,
} from 'react-router-dom'

import {
  useAuth,
} from '../auth/useAuth'

import {
  Button,
} from './ui/Button'

import {
  ConfirmationDialog,
} from './ui/ConfirmationDialog'

type AppShellProps = {
  children: ReactNode
}

type NavigationItem = {
  label: string
  to: string
  ownerOnly?: boolean
}

type NavigationSection = {
  label?: string
  items: NavigationItem[]
}

const navigationSections:
  NavigationSection[] = [
    {
      items: [
        {
          label: 'Dashboard',
          to: '/dashboard',
        },
      ],
    },

    {
      label: 'Operations',

      items: [
        {
          label: 'Inventory',
          to: '/inventory',
        },
        {
          label: 'New Sale',
          to: '/sales/new',
        },
        {
          label: 'Receive Stock',
          to: '/receiving',
        },
        {
          label: 'Adjust Stock',
          to: '/adjustments',
          ownerOnly: true,
        },
      ],
    },

    {
      label: 'Management',

      items: [
        {
          label: 'Products',
          to: '/products',
          ownerOnly: true,
        },
        {
          label: 'Suppliers',
          to: '/suppliers',
          ownerOnly: true,
        },
        {
          label: 'Staff',
          to: '/staff',
          ownerOnly: true,
        },
      ],
    },

    {
      label: 'Insights',

      items: [
        {
          label: 'Reports',
          to: '/reports',
          ownerOnly: true,
        },
        {
          label: 'Movements',
          to: '/movements',
          ownerOnly: true,
        },
        {
          label: 'Audit',
          to: '/audit',
          ownerOnly: true,
        },
      ],
    },
  ]

type NavigationProps = {
  isOwner: boolean
  onNavigate?: () => void
}

function Navigation({
  isOwner,
  onNavigate,
}: NavigationProps) {
  function navLinkClass(
    isActive: boolean,
  ) {
    return [
      'flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'focus-visible:ring-offset-card',
      isActive
        ? 'bg-accent text-accent-foreground'
        : 'text-secondary-foreground hover:bg-secondary',
    ].join(' ')
  }

  return (
    <nav
      aria-label="Main navigation"
      className="space-y-6"
    >
      {navigationSections.map(
        (
          section,
          sectionIndex,
        ) => {
          const visibleItems =
            section.items.filter(
              (item) =>
                !item.ownerOnly ||
                isOwner,
            )

          if (
            visibleItems.length ===
            0
          ) {
            return null
          }

          return (
            <section
              key={
                section.label ??
                sectionIndex
              }
            >
              {section.label && (
                <p className="mb-2 px-3 text-xs font-medium tracking-wide text-muted-foreground">
                  {section.label}
                </p>
              )}

              <div className="space-y-1">
                {visibleItems.map(
                  (item) => (
                    <NavLink
                      key={
                        item.to
                      }
                      to={
                        item.to
                      }
                      onClick={
                        onNavigate
                      }
                      className={({
                        isActive,
                      }) =>
                        navLinkClass(
                          isActive,
                        )
                      }
                    >
                      {
                        item.label
                      }
                    </NavLink>
                  ),
                )}
              </div>
            </section>
          )
        },
      )}
    </nav>
  )
}

export function AppShell({
  children,
}: AppShellProps) {
  const {
    user,
    logout,
  } = useAuth()

  const location =
    useLocation()

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)

  const [
    signOutOpen,
    setSignOutOpen,
  ] = useState(false)

  const mobileCloseButtonRef =
    useRef<HTMLButtonElement>(
      null,
    )

  if (!user) {
    return null
  }

  const isOwner =
    user.role === 'OWNER'

  /*
   * Route changes should always collapse
   * the mobile navigation drawer.
   */
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  /*
   * Prevent the page behind the mobile
   * drawer from scrolling.
   */
  useEffect(() => {
    if (
      !mobileMenuOpen
    ) {
      return
    }

    const previousOverflow =
      document.body.style
        .overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [mobileMenuOpen])

  /*
   * Escape closes the mobile drawer.
   */
  useEffect(() => {
    if (
      !mobileMenuOpen
    ) {
      return
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        setMobileMenuOpen(
          false,
        )
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [mobileMenuOpen])

  /*
   * Move keyboard focus into the drawer
   * when it opens.
   */
  useEffect(() => {
    if (
      mobileMenuOpen
    ) {
      requestAnimationFrame(
        () => {
          mobileCloseButtonRef.current
            ?.focus()
        },
      )
    }
  }, [mobileMenuOpen])

  function handleSignOut() {
    setMobileMenuOpen(false)
    setSignOutOpen(false)
    logout()
  }

  function openSignOutDialog() {
    setMobileMenuOpen(false)
    setSignOutOpen(true)
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex min-h-20 items-center border-b border-border px-6">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              TindaTrack
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Inventory & Orders
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Navigation
            isOwner={
              isOwner
            }
          />
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name}
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {isOwner
                ? 'Owner'
                : 'Staff'}
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={
              openSignOutDialog
            }
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top app bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-card md:hidden">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4">
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-foreground">
              TindaTrack
            </p>
          </div>

          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={
              mobileMenuOpen
            }
            aria-controls="mobile-navigation"
            onClick={() =>
              setMobileMenuOpen(
                true,
              )
            }
            className="flex size-11 items-center justify-center rounded-xl text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="size-5"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          aria-hidden={false}
        >
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/30"
            onClick={() =>
              setMobileMenuOpen(
                false,
              )
            }
          />

          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-border bg-card shadow-xl"
          >
            <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-4">
              <div>
                <p className="text-base font-semibold tracking-tight text-foreground">
                  TindaTrack
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Inventory & Orders
                </p>
              </div>

              <button
                ref={
                  mobileCloseButtonRef
                }
                type="button"
                aria-label="Close navigation menu"
                onClick={() =>
                  setMobileMenuOpen(
                    false,
                  )
                }
                className="flex size-11 items-center justify-center rounded-xl text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <Navigation
                isOwner={
                  isOwner
                }
                onNavigate={() =>
                  setMobileMenuOpen(
                    false,
                  )
                }
              />
            </div>

            <div className="border-t border-border p-4">
              <div className="mb-4 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isOwner
                    ? 'Owner'
                    : 'Staff'}
                </p>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={
                  openSignOutDialog
                }
              >
                Sign out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Application content */}
      <div className="min-w-0 md:pl-64">
        <div className="min-w-0">
          {children}
        </div>
      </div>

      <ConfirmationDialog
        open={
          signOutOpen
        }
        title="Sign out?"
        description="You will need to sign in again to continue."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={
          handleSignOut
        }
        onCancel={() =>
          setSignOutOpen(
            false,
          )
        }
      />
    </div>
  )
}