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

type NavigationIcon =
  | 'dashboard'
  | 'inventory'
  | 'sale'
  | 'receiving'
  | 'adjustment'
  | 'products'
  | 'suppliers'
  | 'staff'
  | 'reports'
  | 'movements'
  | 'audit'

type NavigationItem = {
  label: string
  to: string
  icon: NavigationIcon
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
          icon: 'dashboard',
        },
      ],
    },

    {
      label: 'Operations',

      items: [
        {
          label: 'Inventory',
          to: '/inventory',
          icon: 'inventory',
        },

        {
          label: 'New Sale',
          to: '/sales/new',
          icon: 'sale',
        },

        {
          label: 'Receive Stock',
          to: '/receiving',
          icon: 'receiving',
        },

        {
          label: 'Adjust Stock',
          to: '/adjustments',
          icon: 'adjustment',
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
          icon: 'products',
          ownerOnly: true,
        },

        {
          label: 'Suppliers',
          to: '/suppliers',
          icon: 'suppliers',
          ownerOnly: true,
        },

        {
          label: 'Staff',
          to: '/staff',
          icon: 'staff',
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
          icon: 'reports',
          ownerOnly: true,
        },

        {
          label: 'Movements',
          to: '/movements',
          icon: 'movements',
          ownerOnly: true,
        },

        {
          label: 'Audit',
          to: '/audit',
          icon: 'audit',
          ownerOnly: true,
        },
      ],
    },
  ]

function BrandMark() {
  return (
    <div
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_2px_4px_rgba(53,68,119,0.16)]"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path
          d="m4 8 8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8M12 12v8M8 6l8 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function NavigationIcon({
  name,
}: {
  name: NavigationIcon
}) {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap:
      'round' as const,
    strokeLinejoin:
      'round' as const,
    'aria-hidden':
      true as const,
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...commonProps}>
          <rect
            x="4"
            y="4"
            width="6"
            height="6"
            rx="1.5"
          />

          <rect
            x="14"
            y="4"
            width="6"
            height="6"
            rx="1.5"
          />

          <rect
            x="4"
            y="14"
            width="6"
            height="6"
            rx="1.5"
          />

          <rect
            x="14"
            y="14"
            width="6"
            height="6"
            rx="1.5"
          />
        </svg>
      )

    case 'inventory':
      return (
        <svg {...commonProps}>
          <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5z" />
          <path d="M5 7.5 12 11l7-3.5" />
          <path d="M12 11v9" />
        </svg>
      )

    case 'sale':
      return (
        <svg {...commonProps}>
          <path d="M5 6h14v12H5z" />
          <path d="M8 10h8" />
          <path d="M8 14h3" />
        </svg>
      )

    case 'receiving':
      return (
        <svg {...commonProps}>
          <path d="M12 4v10" />
          <path d="m8 10 4 4 4-4" />
          <path d="M5 17v3h14v-3" />
        </svg>
      )

    case 'adjustment':
      return (
        <svg {...commonProps}>
          <path d="M4 7h10" />
          <path d="M18 7h2" />
          <circle
            cx="16"
            cy="7"
            r="2"
          />

          <path d="M4 17h2" />
          <path d="M10 17h10" />
          <circle
            cx="8"
            cy="17"
            r="2"
          />
        </svg>
      )

    case 'products':
      return (
        <svg {...commonProps}>
          <rect
            x="4"
            y="5"
            width="16"
            height="14"
            rx="2"
          />

          <path d="M4 10h16" />
          <path d="M9 5v5" />
        </svg>
      )

    case 'suppliers':
      return (
        <svg {...commonProps}>
          <path d="M4 18V8l8-4 8 4v10" />
          <path d="M8 18v-4h8v4" />
          <path d="M8 9h.01M12 9h.01M16 9h.01" />
        </svg>
      )

    case 'staff':
      return (
        <svg {...commonProps}>
          <circle
            cx="9"
            cy="8"
            r="3"
          />

          <path d="M4 19c0-3 2-5 5-5s5 2 5 5" />

          <path d="M16 8.5c2 .3 3 1.5 3 3.5" />

          <path d="M16 15c2.2.3 4 1.8 4 4" />
        </svg>
      )

    case 'reports':
      return (
        <svg {...commonProps}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
        </svg>
      )

    case 'movements':
      return (
        <svg {...commonProps}>
          <path d="M5 7h13" />
          <path d="m15 4 3 3-3 3" />

          <path d="M19 17H6" />
          <path d="m9 14-3 3 3 3" />
        </svg>
      )

    case 'audit':
      return (
        <svg {...commonProps}>
          <path d="M7 4h10v16H7z" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      )
  }
}

type NavigationProps = {
  isOwner: boolean
  onNavigate?: () => void
}

function Navigation({
  isOwner,
  onNavigate,
}: NavigationProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="space-y-5"
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
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
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
                        [
                          'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium',
                          'transition-colors duration-150 motion-reduce:transition-none',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isActive
                            ? [
                                'bg-accent/70 text-accent-foreground',
                                'before:absolute before:left-0 before:top-1/2',
                                'before:h-4 before:w-[3px] before:-translate-y-1/2',
                                'before:rounded-full before:bg-primary',
                              ].join(
                                ' ',
                              )
                            : 'text-secondary-foreground hover:bg-secondary/70 hover:text-foreground',
                        ].join(
                          ' ',
                        )
                      }
                    >
                      {({
                        isActive,
                      }) => (
                        <>
                          <span
                            className={[
                              'flex size-5 shrink-0 items-center justify-center transition-colors motion-reduce:transition-none',
                              isActive
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-secondary-foreground',
                            ].join(
                              ' ',
                            )}
                          >
                            <NavigationIcon
                              name={
                                item.icon
                              }
                            />
                          </span>

                          <span className="truncate">
                            {
                              item.label
                            }
                          </span>
                        </>
                      )}
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

  const mobileMenuButtonRef =
    useRef<HTMLButtonElement>(
      null,
    )

  const mobileCloseButtonRef =
    useRef<HTMLButtonElement>(
      null,
    )

  const isOwner =
    user?.role === 'OWNER'

  /*
   * Route changes collapse the mobile
   * navigation automatically.
   */
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  /*
   * Prevent the application underneath
   * the mobile drawer from scrolling.
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

        requestAnimationFrame(
          () => {
            mobileMenuButtonRef.current
              ?.focus()
          },
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
   * Give keyboard users an obvious
   * starting point when the drawer opens.
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

  if (!user) {
    return null
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  function handleSignOut() {
    setMobileMenuOpen(false)
    setSignOutOpen(false)
    logout()
  }

  function openSignOutDialog() {
    setMobileMenuOpen(false)
    setSignOutOpen(true)
  }

  const userInitial =
    user.name
      .trim()
      .charAt(0)
      .toUpperCase()

  // Display the current route without adding another navigation control.
  const currentSection = navigationSections.find((section) =>
    section.items.some((item) =>
      (!item.ownerOnly || isOwner) &&
      (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)),
    ),
  )

  const currentPage = currentSection?.items.find((item) =>
    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  )

  const workspaceLabel = isOwner ? 'Owner workspace' : 'Staff workspace'

  return (
    <div className="min-h-dvh bg-[#f6f7f9] text-foreground">
      {/* Desktop navigation */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 bg-card md:flex md:flex-col">
        {/* Brand */}
        <div className="flex min-h-[76px] items-center px-5">
          <div className="flex items-center gap-3">
            <BrandMark />

            <div className="min-w-0">
              <p className="text-[17px] font-semibold tracking-[-0.04em] text-foreground">
                TindaTrack
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Store operations
              </p>
            </div>
          </div>
        </div>

        <div className="mx-5 border-t border-border/60" />

        <div className="mx-4 mb-1 mt-4 flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 px-3 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-card text-primary">
            <NavigationIcon name="suppliers" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-secondary-foreground">Store workspace</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {isOwner ? 'Owner access' : 'Staff access'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <Navigation
            isOwner={
              isOwner
            }
          />
        </div>

        {/* User */}
        <div className="border-t border-border/60 p-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary text-xs font-semibold text-secondary-foreground">
                {userInitial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isOwner
                    ? 'Store owner'
                    : 'Staff member'}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              className="mt-3 w-full justify-start gap-3 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={
                openSignOutDialog
              }
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-4"
              >
                <path
                  d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />

                <path
                  d="M14 8l4 4-4 4M18 12H9"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile app bar */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/95 backdrop-blur md:hidden">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />

            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                TindaTrack
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {currentPage?.label ?? workspaceLabel}
              </p>
            </div>
          </div>

          <button
            ref={
              mobileMenuButtonRef
            }
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
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="size-5"
            >
              <path
                d="M5 7h14M5 12h14M5 17h14"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={
              closeMobileMenu
            }
          />

          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-border/60 bg-card shadow-2xl"
          >
            {/* Drawer brand */}
            <div className="flex min-h-[76px] items-center justify-between gap-4 px-5">
              <div className="flex min-w-0 items-center gap-3">
                <BrandMark />

                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    TindaTrack
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Store operations
                  </p>
                </div>
              </div>

              <button
                ref={
                  mobileCloseButtonRef
                }
                type="button"
                aria-label="Close navigation menu"
                onClick={
                  closeMobileMenu
                }
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                >
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mx-5 border-t border-border/60" />

            {/* Drawer navigation */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
              <Navigation
                isOwner={
                  isOwner
                }
                onNavigate={
                  closeMobileMenu
                }
              />
            </div>

            {/* Drawer user */}
            <div className="border-t border-border/60 p-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary text-xs font-semibold text-secondary-foreground">
                    {userInitial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {isOwner
                        ? 'Store owner'
                        : 'Staff member'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="mt-3 w-full justify-start gap-3 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
                  onClick={
                    openSignOutDialog
                  }
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-4"
                  >
                    <path
                      d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />

                    <path
                      d="M14 8l4 4-4 4M18 12H9"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  Sign out
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Page canvas */}
      <div className="min-w-0 md:pl-64">
        <header className="hidden min-h-[76px] items-center justify-between gap-4 border-b border-border/60 bg-card px-6 md:flex lg:px-8">
          <div className="flex min-w-0 items-center gap-3 text-[13px]">
            <span className="shrink-0 text-muted-foreground">
              {currentSection?.label ?? 'Workspace'}
            </span>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 shrink-0 text-muted-foreground/60">
              <path d="m8 6 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="truncate font-medium text-foreground">
              {currentPage?.label ?? 'TindaTrack'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <span className="rounded-md border border-border/60 bg-secondary/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {workspaceLabel}
            </span>
            <div className="flex items-center gap-2.5 border-l border-border/60 pl-4">
              <span className="hidden max-w-40 truncate text-xs font-medium text-secondary-foreground lg:block">
                {user.name}
              </span>
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                {userInitial}
              </span>
            </div>
          </div>
        </header>

        <div className="min-w-0 md:min-h-[calc(100dvh-76px)] md:py-4 lg:py-6">
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
