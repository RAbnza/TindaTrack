import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useOutletContext,
} from 'react-router-dom'

import {
  RequireAuth,
} from './auth/RequireAuth'

import {
  RequireOwner,
} from './auth/RequireOwner'

import {
  useAuth,
} from './auth/useAuth'

import {
  AppShell,
} from './components/AppShell'

import {
  useProducts,
} from './features/inventory/useProducts'

import {
  useSetupStatus,
} from './features/setup/useSetupStatus'

import {
  AdjustStockPage,
} from './pages/AdjustStockPage'

import {
  AuditHistoryPage,
} from './pages/AuditHistoryPage'

import {
  DashboardPage,
} from './pages/DashboardPage'

import {
  DailySalesPage,
} from './pages/DailySalesPage'

import {
  InventoryPage,
} from './pages/InventoryPage'

import {
  LoginPage,
} from './pages/LoginPage'

import {
  NewSalePage,
} from './pages/NewSalePage'

import {
  ProductManagementPage,
} from './pages/ProductManagementPage'

import {
  ReceiveStockPage,
} from './pages/ReceiveStockPage'

import {
  SetupPage,
} from './pages/SetupPage'

import {
  StaffManagementPage,
} from './pages/StaffManagementPage'

import {
  StockMovementsPage,
} from './pages/StockMovementsPage'

import {
  SupplierManagementPage,
} from './pages/SupplierManagementPage'

import type {
  Product,
} from './types/product'

type ProductRouteContext = {
  products: Product[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

type SetupStatusStateProps = {
  isLoading: boolean
  error: string | null
  onRetry: () => Promise<void>
}

function SetupStatusState({
  isLoading,
  error,
  onRetry,
}: SetupStatusStateProps) {
  if (isLoading) {
    return (
      <main className="min-h-dvh bg-slate-50 px-4 py-8">
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-sm items-center justify-center">
          <p className="text-sm text-slate-600">
            Checking setup
            status...
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-dvh bg-slate-50 px-4 py-8">
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-sm items-center">
          <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-4">
            <p
              role="alert"
              className="text-sm text-red-800"
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void onRetry()
              }
              className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    )
  }

  return null
}

function RootRoute() {
  const {
    isAuthenticated,
  } = useAuth()

  const {
    setupRequired,
    isLoading,
    error,
    reload,
  } = useSetupStatus()

  if (
    isLoading ||
    error
  ) {
    return (
      <SetupStatusState
        isLoading={
          isLoading
        }
        error={error}
        onRetry={reload}
      />
    )
  }

  if (setupRequired) {
    return (
      <Navigate
        to="/setup"
        replace
      />
    )
  }

  return (
    <Navigate
      to={
        isAuthenticated
          ? '/dashboard'
          : '/login'
      }
      replace
    />
  )
}

function LoginRoute() {
  const {
    isAuthenticated,
  } = useAuth()

  const {
    setupRequired,
    isLoading,
    error,
    reload,
  } = useSetupStatus()

  if (
    isLoading ||
    error
  ) {
    return (
      <SetupStatusState
        isLoading={
          isLoading
        }
        error={error}
        onRetry={reload}
      />
    )
  }

  if (setupRequired) {
    return (
      <Navigate
        to="/setup"
        replace
      />
    )
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return <LoginPage />
}

function SetupRoute() {
  const {
    isAuthenticated,
  } = useAuth()

  const {
    setupRequired,
    isLoading,
    error,
    reload,
  } = useSetupStatus()

  if (
    isLoading ||
    error
  ) {
    return (
      <SetupStatusState
        isLoading={
          isLoading
        }
        error={error}
        onRetry={reload}
      />
    )
  }

  if (!setupRequired) {
    return (
      <Navigate
        to={
          isAuthenticated
            ? '/dashboard'
            : '/login'
        }
        replace
      />
    )
  }

  return <SetupPage />
}

function AuthenticatedLayout() {
  const {
    products,
    isLoading,
    error,
    reload,
  } = useProducts()

  const context:
    ProductRouteContext = {
      products,
      isLoading,
      error,
      reload,
    }

  return (
    <AppShell>
      <Outlet
        context={context}
      />
    </AppShell>
  )
}

function InventoryRoute() {
  const {
    products,
    isLoading,
    error,
    reload,
  } =
    useOutletContext<ProductRouteContext>()

  return (
    <InventoryPage
      products={products}
      isLoading={isLoading}
      error={error}
      reload={reload}
    />
  )
}

function ProductManagementRoute() {
  const {
    products,
    isLoading,
    error,
    reload,
  } =
    useOutletContext<ProductRouteContext>()

  return (
    <ProductManagementPage
      products={products}
      isLoading={isLoading}
      error={error}
      reload={reload}
    />
  )
}

function NewSaleRoute() {
  const {
    products,
    isLoading,
    error,
    reload,
  } =
    useOutletContext<ProductRouteContext>()

  return (
    <NewSalePage
      products={products}
      isProductsLoading={
        isLoading
      }
      productsError={error}
      reloadProducts={reload}
    />
  )
}

function ReceivingRoute() {
  const {
    products,
    isLoading,
    error,
    reload,
  } =
    useOutletContext<ProductRouteContext>()

  return (
    <ReceiveStockPage
      products={products}
      isProductsLoading={
        isLoading
      }
      productsError={error}
      reloadProducts={reload}
    />
  )
}

function AdjustmentRoute() {
  const {
    products,
    isLoading,
    error,
    reload,
  } =
    useOutletContext<ProductRouteContext>()

  return (
    <AdjustStockPage
      products={products}
      isProductsLoading={
        isLoading
      }
      productsError={error}
      reloadProducts={reload}
    />
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RootRoute />
        }
      />

      <Route
        path="/setup"
        element={
          <SetupRoute />
        }
      />

      <Route
        path="/login"
        element={
          <LoginRoute />
        }
      />

      <Route
        element={
          <RequireAuth>
            <AuthenticatedLayout />
          </RequireAuth>
        }
      >
        <Route
          path="/dashboard"
          element={
            <DashboardPage />
          }
        />

        <Route
          path="/inventory"
          element={
            <InventoryRoute />
          }
        />

        <Route
          path="/products"
          element={
            <RequireOwner>
              <ProductManagementRoute />
            </RequireOwner>
          }
        />

        <Route
          path="/suppliers"
          element={
            <RequireOwner>
              <SupplierManagementPage />
            </RequireOwner>
          }
        />

        <Route
          path="/staff"
          element={
            <RequireOwner>
              <StaffManagementPage />
            </RequireOwner>
          }
        />

        <Route
          path="/sales/new"
          element={
            <NewSaleRoute />
          }
        />

        <Route
          path="/receiving"
          element={
            <ReceivingRoute />
          }
        />

        <Route
          path="/adjustments"
          element={
            <RequireOwner>
              <AdjustmentRoute />
            </RequireOwner>
          }
        />

        <Route
          path="/reports"
          element={
            <RequireOwner>
              <DailySalesPage />
            </RequireOwner>
          }
        />

        <Route
          path="/movements"
          element={
            <RequireOwner>
              <StockMovementsPage />
            </RequireOwner>
          }
        />

        <Route
          path="/audit"
          element={
            <RequireOwner>
              <AuditHistoryPage />
            </RequireOwner>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <RootRoute />
        }
      />
    </Routes>
  )
}

export default App