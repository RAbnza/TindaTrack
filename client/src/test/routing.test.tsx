import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  MemoryRouter,
} from 'react-router-dom'

import {
  render,
  screen,
} from '@testing-library/react'

import type {
  ReactNode,
} from 'react'

import type {
  AuthUser,
} from '../types/auth'

const mocks =
  vi.hoisted(() => ({
    auth: {
      user:
        null as AuthUser | null,

      isAuthenticated:
        false,

      login:
        vi.fn(),

      logout:
        vi.fn(),
    },

    setup: {
      setupRequired:
        false as boolean | null,

      isLoading:
        false,

      error:
        null as string | null,

      reload:
        vi.fn(),
    },

    products: {
      products: [],
      isLoading: false,
      error:
        null as string | null,

      reload:
        vi.fn(),
    },
  }))

vi.mock(
  '../auth/useAuth',
  () => ({
    useAuth: () =>
      mocks.auth,
  }),
)

vi.mock(
  '../features/setup/useSetupStatus',
  () => ({
    useSetupStatus:
      () => mocks.setup,
  }),
)

vi.mock(
  '../features/inventory/useProducts',
  () => ({
    useProducts:
      () => mocks.products,
  }),
)

vi.mock(
  '../components/AppShell',
  () => ({
    AppShell: ({
      children,
    }: {
      children: ReactNode
    }) => (
      <div>
        {children}
      </div>
    ),
  }),
)

vi.mock(
  '../pages/DashboardPage',
  () => ({
    DashboardPage:
      () => (
        <h1>
          Dashboard test page
        </h1>
      ),
  }),
)

vi.mock(
  '../pages/InventoryPage',
  () => ({
    InventoryPage:
      () => (
        <h1>
          Inventory test page
        </h1>
      ),
  }),
)

import App from '../App'

function renderApp(
  route: string,
) {
  return render(
    <MemoryRouter
      initialEntries={[
        route,
      ]}
    >
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.auth.user =
    null

  mocks.auth.isAuthenticated =
    false

  mocks.setup.setupRequired =
    false

  mocks.setup.isLoading =
    false

  mocks.setup.error =
    null

  mocks.products.products =
    []

  mocks.products.isLoading =
    false

  mocks.products.error =
    null
})

describe(
  'application routing',
  () => {
    it(
      'redirects a fresh installation from / to setup',
      async () => {
        mocks.setup.setupRequired =
          true

        renderApp('/')

        expect(
          await screen.findByRole(
            'heading',
            {
              name:
                /set up your store/i,
            },
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      'renders the public landing page at / when configured and logged out',
      async () => {
        renderApp('/')

        expect(
          await screen.findByRole(
            'heading',
            {
              name:
                /keep inventory accurate/i,
            },
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      'renders login directly at /login when configured and logged out',
      async () => {
        renderApp(
          '/login',
        )

        expect(
          await screen.findByRole(
            'heading',
            {
              name:
                /store operations.*without the guesswork/i,
            },
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      'redirects authenticated users from / to the dashboard',
      async () => {
        mocks.auth.user = {
          id: 1,

          name:
            'Store Owner',

          email:
            'owner@test.local',

          role:
            'OWNER',
        }

        mocks.auth.isAuthenticated =
          true

        renderApp('/')

        expect(
          await screen.findByRole(
            'heading',
            {
              name:
                'Dashboard test page',
            },
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      'prevents STAFF from reaching an OWNER route through client routing',
      async () => {
        mocks.auth.user = {
          id: 2,

          name:
            'Store Staff',

          email:
            'staff@test.local',

          role:
            'STAFF',
        }

        mocks.auth.isAuthenticated =
          true

        renderApp(
          '/staff',
        )

        expect(
          await screen.findByRole(
            'heading',
            {
              name:
                'Inventory test page',
            },
          ),
        ).toBeInTheDocument()
      },
    )
  },
)