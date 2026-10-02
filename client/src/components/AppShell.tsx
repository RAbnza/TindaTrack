import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  Link,
  NavLink,
  useLocation,
} from 'react-router-dom'

import {
  useAuth,
} from '../auth/useAuth'

import {
  getVisibleNavigation,
} from '../config/navigation'

import type {
  UserRole,
} from '../types/auth'

import {
  AppIcon,
} from './AppIcon'

import {
  BrandMark,
} from './BrandMark'

import {
  PanelSheet,
} from './layout/PanelSheet'

import {
  WorkspaceInspector,
} from './layout/WorkspaceInspector'

import {
  WorkspaceProvider,
} from './layout/WorkspaceProvider'

import {
  useWorkspaceInspector,
} from './layout/useWorkspaceInspector'

import {
  Badge,
  Button,
  ConfirmationDialog,
} from './ui'

type AppShellProps = {
  children: ReactNode
}

type NavigationProps = {
  role: UserRole
  onNavigate?: () => void
}

function Navigation({
  role,
  onNavigate,
}: NavigationProps) {
  const visibleNavigation =
    getVisibleNavigation(
      role,
    )

  return (
    <nav
      aria-label="Main navigation"
      className="space-y-5"
    >
      {visibleNavigation.map(
        (section) => (
          <section
            key={
              section.label
            }
          >
            <h2 className="mb-2 px-3 text-caption font-medium text-muted-foreground">
              {
                section.label
              }
            </h2>

            <div className="space-y-1">
              {section.items.map(
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
                        'flex min-h-11 items-center gap-3 rounded-lg px-3 text-ui transition-colors motion-reduce:transition-none',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-secondary-foreground hover:bg-secondary',
                      ].join(
                        ' ',
                      )
                    }
                  >
                    <AppIcon
                      name={
                        item.icon
                      }
                    />

                    <span className="truncate">
                      {
                        item.label
                      }
                    </span>
                  </NavLink>
                ),
              )}
            </div>
          </section>
        ),
      )}
    </nav>
  )
}

function ShellLayout({
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

  const {
    inspectorOpen,
    setInspectorOpen,
    setSummaryTarget,
  } =
    useWorkspaceInspector()

  const closeNavigation =
    useCallback(
      () =>
        setMobileMenuOpen(
          false,
        ),
      [],
    )

  const closeInspector =
    useCallback(
      () =>
        setInspectorOpen(
          false,
        ),
      [
        setInspectorOpen,
      ],
    )

    useEffect(() => {
      document
        .getElementById(
          'workspace-content',
        )
        ?.focus({
          preventScroll:
            true,
        })
    }, [
      location.pathname,
    ])

  if (!user) {
    return null
  }

  const navigation =
    getVisibleNavigation(
      user.role,
    )

  const currentSection =
    navigation.find(
      (section) =>
        section.items.some(
          (item) =>
            location.pathname ===
              item.to ||
            location.pathname.startsWith(
              `${item.to}/`,
            ),
        ),
    )

  const currentPage =
    currentSection?.items.find(
      (item) =>
        location.pathname ===
          item.to ||
        location.pathname.startsWith(
          `${item.to}/`,
        ),
    )

  const pageLabel =
    currentPage?.label ??
    'Workspace'

  const isTransaction = ['/sales/new', '/receiving', '/adjustments'].includes(location.pathname)

  const isOwner =
    user.role ===
    'OWNER'

  const initial =
    user.name
      .trim()
      .charAt(0)
      .toUpperCase()

  function openSignOut() {
    setMobileMenuOpen(
      false,
    )

    setSignOutOpen(
      true,
    )
  }

  function signOut() {
    setSignOutOpen(
      false,
    )

    logout()

    /*
     * Explicit sign-out leaves the
     * authenticated application entirely.
     *
     * Using a full location replacement
     * avoids RequireAuth racing the
     * client-side route change and
     * sending the user to /login.
     *
     * RootRoute will then render the
     * LandingPage for a configured,
     * unauthenticated store.
     */
    window.location.replace(
      '/',
    )
  }

  const account = (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-ui font-medium text-secondary-foreground"
        >
          {initial}
        </span>

        <div className="min-w-0">
          <p className="truncate text-ui font-medium">
            {
              user.name
            }
          </p>

          <p className="mt-0.5 text-caption text-muted-foreground">
            {isOwner
              ? 'Store owner'
              : 'Staff member'}
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        className="mt-3 w-full justify-start text-ui text-muted-foreground"
        onClick={
          openSignOut
        }
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-4"
        >
          <path
            d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4m4-12 4 4-4 4m4-4H9"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        Sign out
      </Button>
    </div>
  )

  const inspector = (
    <WorkspaceInspector
      pathname={
        location.pathname
      }
      pageLabel={
        pageLabel
      }
      role={
        user.role
      }
    />
  )

  return (
    <div className="application-root">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:text-primary focus:ring-2 focus:ring-ring"
      >
        Skip to page content
      </a>

      <div className="app-shell">
        <header className="shell-header">
          <div className="shell-brand">
            <BrandMark />

            <div className="min-w-0">
              <p className="text-brand font-semibold tracking-tight">
                TindaTrack
              </p>

              <p className="hidden text-caption text-muted-foreground sm:block">
                Store operations
              </p>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-2 text-ui md:flex">
            <span className="text-muted-foreground">
              {currentSection
                ?.label ??
                'Workspace'}
            </span>

            <span
              aria-hidden="true"
              className="text-muted-foreground"
            >
              /
            </span>

            <span className="truncate font-medium">
              {
                pageLabel
              }
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              to="/sales/new"
              className="hidden min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-ui font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:inline-flex"
            >
              <AppIcon
                name="sale"
              />

              New Sale
            </Link>

            {!isTransaction && (
              <Button
                variant="ghost"
                aria-label="Open workspace details"
                aria-haspopup="dialog"
                onClick={() => setInspectorOpen(true)}
                className="size-11 p-0 xl:hidden"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                >
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M14 4v16"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </Button>
            )}

            <Button
              variant="ghost"
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              onClick={() =>
                setMobileMenuOpen(
                  true,
                )
              }
              className="size-11 p-0 md:hidden"
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
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </Button>

            <span
              aria-hidden="true"
              className="hidden size-8 items-center justify-center rounded-full bg-accent text-caption font-medium text-accent-foreground md:flex"
            >
              {initial}
            </span>
          </div>
        </header>

        <div className="shell-body">
          <aside
            className="shell-navigation"
            aria-label="Store navigation"
          >
            <div className="border-b border-border px-5 py-4">
              <p className="text-ui font-medium">
                Store workspace
              </p>

              <p className="mt-1 text-caption text-muted-foreground">
                {isOwner
                  ? 'Owner access'
                  : 'Staff access'}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <Navigation
                role={
                  user.role
                }
              />
            </div>

            {account}
          </aside>

          <div className="workspace-canvas">
            <div className="page-preview">
              <div className="preview-toolbar">
                <div className="flex min-w-0 items-center gap-2 text-ui text-secondary-foreground">
                  <span className="text-muted-foreground">
                    <AppIcon
                      name={
                        currentPage
                          ?.icon ??
                        'dashboard'
                      }
                    />
                  </span>

                  <span className="truncate font-medium">
                    {
                      pageLabel
                    }
                  </span>
                </div>

                <Badge className="shrink-0">
                  {isOwner
                    ? 'Owner view'
                    : 'Staff view'}
                </Badge>
              </div>

              <div
                id="workspace-content"
                tabIndex={-1}
                className="min-w-0 outline-none"
              >
                {children}
              </div>
            </div>
          </div>

          <aside
            className="shell-inspector"
            aria-label={isTransaction ? 'Transaction summary panel' : 'Workspace details'}
          >
            {isTransaction ? <div className="min-h-0 flex-1 bg-surface-tint" ref={setSummaryTarget} /> : inspector}
          </aside>
        </div>
      </div>

      <PanelSheet
        open={
          mobileMenuOpen
        }
        title="Navigation"
        side="left"
        collapseAt={768}
        onClose={
          closeNavigation
        }
      >
        <div className="flex min-h-full flex-col">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <BrandMark />

            <span className="text-brand font-semibold">
              TindaTrack
            </span>
          </div>

          <div className="flex-1 p-3">
            <Navigation
              role={
                user.role
              }
              onNavigate={
                closeNavigation
              }
            />
          </div>

          {account}
        </div>
      </PanelSheet>

      {!isTransaction && (
        <PanelSheet
          open={inspectorOpen}
          title="Workspace details"
          side="right"
          collapseAt={1280}
          onClose={closeInspector}
        >
          {inspector}
        </PanelSheet>
      )}

      <ConfirmationDialog
        open={
          signOutOpen
        }
        title="Sign out?"
        description="You will need to sign in again to continue."
        confirmLabel="Sign out"
        variant="danger"
        onConfirm={
          signOut
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

export function AppShell({
  children,
}: AppShellProps) {
  const {
    pathname,
  } = useLocation()

  return (
    <WorkspaceProvider
      key={
        pathname
      }
    >
      <ShellLayout>
        {children}
      </ShellLayout>
    </WorkspaceProvider>
  )
}
