import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { AuthContext } from '../auth/auth-context'
import { AppShell } from '../components/AppShell'
import { getDashboard } from '../api/dashboard.api'
import { createInitialOwner } from '../api/setup.api'
import { DashboardPage } from '../pages/DashboardPage'
import { InventoryPage } from '../pages/InventoryPage'
import { SetupPage } from '../pages/SetupPage'
import type { Product } from '../types/product'
import type { UserRole } from '../types/auth'
import { renderWithRouter } from './test-utils'

vi.mock('../api/dashboard.api', () => ({ getDashboard: vi.fn() }))
vi.mock('../api/setup.api', () => ({ createInitialOwner: vi.fn() }))
beforeEach(() => vi.clearAllMocks())

const products: Product[] = [
  {
    id: 1,
    name: 'Milk',
    sku: 'MILK-01',
    category: 'Dairy',
    sellingPrice: '85.00',
    reorderLevel: 5,
    active: true,
    currentStock: 2,
    lowStock: true,
  },
  {
    id: 2,
    name: 'Rice',
    sku: 'RICE-02',
    category: 'Staples',
    sellingPrice: '55.00',
    reorderLevel: 5,
    active: true,
    currentStock: 30,
    lowStock: false,
  },
]

function renderWorkspace(
  page: React.ReactElement,
  role: UserRole,
  route: string,
) {
  return renderWithRouter(
    <AuthContext.Provider
      value={{
        user: { id: 1, name: 'Alex', email: 'alex@test.local', role },
        isAuthenticated: true,
        login: async () => {},
        logout: () => {},
      }}
    >
      <AppShell>{page}</AppShell>
    </AuthContext.Provider>,
    route,
  )
}

it.each(['OWNER', 'STAFF'] as const)(
  'preserves dashboard data and quick-action access for %s',
  async (role) => {
    vi.mocked(getDashboard).mockResolvedValue(
      role === 'OWNER'
        ? {
            role,
            date: '2026-10-02',
            metrics: {
              salesCount: 14,
              totalSalesAmount: '1840.50',
              lowStockCount: 1,
              outOfStockCount: 0,
              activeProductCount: 82,
              activeStaffCount: 3,
            },
            lowStockProducts: [products[0]],
          }
        : {
            role,
            date: '2026-10-02',
            metrics: {
              mySalesCount: 7,
              lowStockCount: 1,
              outOfStockCount: 0,
              activeProductCount: 82,
            },
            lowStockProducts: [products[0]],
          },
    )
    renderWorkspace(<DashboardPage />, role, '/dashboard')
    const content = screen.getByRole('main')
    const actions = await screen.findByRole('region', { name: 'Quick actions' })
    expect(getDashboard).toHaveBeenCalledTimes(1)
    expect(
      within(content)
        .getByRole('heading', { name: 'Active products' })
        .closest('.ui-card'),
    ).toHaveTextContent('82')
    expect(
      within(actions).getByRole('link', { name: 'New Sale' }),
    ).toHaveAttribute('href', '/sales/new')
    expect(
      within(actions).getByRole('link', { name: 'Receive Stock' }),
    ).toHaveAttribute('href', '/receiving')
    if (role === 'OWNER') {
      expect(
        within(content)
          .getByRole('heading', { name: "Today's sales" })
          .closest('.ui-card'),
      ).toHaveTextContent('1,840.50')
      expect(
        within(actions).getByRole('link', { name: 'Adjust Stock' }),
      ).toHaveAttribute('href', '/adjustments')
      expect(
        within(actions).getByRole('link', { name: 'Reports' }),
      ).toHaveAttribute('href', '/reports')
    } else {
      expect(
        within(content)
          .getByRole('heading', { name: "Sales you've recorded" })
          .closest('.ui-card'),
      ).toHaveTextContent('7')
      expect(
        within(content).queryByRole('heading', { name: "Today's sales" }),
      ).not.toBeInTheDocument()
      expect(
        within(actions).queryByRole('link', { name: 'Adjust Stock' }),
      ).not.toBeInTheDocument()
      expect(
        within(actions).queryByRole('link', { name: 'Reports' }),
      ).not.toBeInTheDocument()
    }
    fireEvent.click(
      within(content).getByRole('button', {
        name: 'View stock details for Milk',
      }),
    )
    const details = await screen.findByRole('dialog', {
      name: 'Workspace details',
    })
    expect(
      within(details).getByRole('heading', { name: 'Milk' }),
    ).toBeInTheDocument()
  },
)

it('preserves inventory name/SKU search, the stock filter, and product detail selection', async () => {
  renderWorkspace(
    <InventoryPage
      products={products}
      isLoading={false}
      error={null}
      reload={async () => {}}
    />,
    'OWNER',
    '/inventory',
  )
  const content = screen.getByRole('main')
  const search = within(content).getByRole('searchbox', {
    name: 'Search inventory',
  })
  fireEvent.change(search, { target: { value: '  rice-02  ' } })
  expect(
    within(content).getByRole('heading', { name: 'Rice' }),
  ).toBeInTheDocument()
  expect(
    within(content).queryByRole('heading', { name: 'Milk' }),
  ).not.toBeInTheDocument()
  fireEvent.change(search, { target: { value: '' } })
  fireEvent.click(
    within(content).getByRole('button', { name: 'Low stock only' }),
  )
  expect(
    within(content).queryByRole('heading', { name: 'Rice' }),
  ).not.toBeInTheDocument()
  expect(
    within(content).getByRole('button', { name: 'Showing low stock' }),
  ).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(
    within(content).getByRole('button', {
      name: 'View stock details for Milk',
    }),
  )
  const details = await screen.findByRole('dialog', {
    name: 'Workspace details',
  })
  expect(
    within(details).getByRole('heading', { name: 'Milk' }),
  ).toBeInTheDocument()
  expect(within(details).getByText('MILK-01')).toBeInTheDocument()
})

it('preserves setup password matching, the owner payload, and the sign-in destination', async () => {
  vi.mocked(createInitialOwner).mockResolvedValue({
    id: 1,
    name: 'Alex',
    email: 'alex@test.local',
    role: 'OWNER',
    active: true,
  })
  renderWithRouter(
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<h1>Sign in destination</h1>} />
    </Routes>,
    '/setup',
  )
  fireEvent.change(screen.getByLabelText('Owner name'), {
    target: { value: 'Alex' },
  })
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'alex@test.local' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'test-password' },
  })
  fireEvent.change(screen.getByLabelText('Confirm password'), {
    target: { value: 'different-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create Owner Account' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.')
  expect(createInitialOwner).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Confirm password'), {
    target: { value: 'test-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create Owner Account' }))
  await waitFor(() =>
    expect(createInitialOwner).toHaveBeenCalledExactlyOnceWith({
      name: 'Alex',
      email: 'alex@test.local',
      password: 'test-password',
    }),
  )
  expect(
    await screen.findByRole('heading', { name: 'Sign in destination' }),
  ).toBeInTheDocument()
})
