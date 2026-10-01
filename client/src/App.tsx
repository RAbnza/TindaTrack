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
  AdjustStockPage,
} from './pages/AdjustStockPage'

import {
  AuditHistoryPage,
} from './pages/AuditHistoryPage'

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
  ReceiveStockPage,
} from './pages/ReceiveStockPage'

import {
  StockMovementsPage,
} from './pages/StockMovementsPage'

import type {
  Product,
} from './types/product'

type ProductRouteContext = {
  products: Product[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

function RootRedirect() {
  const {
    isAuthenticated,
  } = useAuth()

  return (
    <Navigate
      to={
        isAuthenticated
          ? '/inventory'
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

  if (isAuthenticated) {
    return (
      <Navigate
        to="/inventory"
        replace
      />
    )
  }

  return <LoginPage />
}

function AuthenticatedLayout() {
  const {
    products,
    isLoading,
    error,
    reload,
  } = useProducts()

  const context: ProductRouteContext = {
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
          <RootRedirect />
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
          path="/inventory"
          element={
            <InventoryRoute />
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
          <RootRedirect />
        }
      />
    </Routes>
  )
}

export default App