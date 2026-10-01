import {
  useState,
} from 'react'

import {
  useAuth,
} from './auth/useAuth'

import {
  AppShell,
  type AppView,
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

function AuthenticatedApp() {
  const {
    user,
  } = useAuth()

  const [
    activeView,
    setActiveView,
  ] =
    useState<AppView>(
      'inventory',
    )

  const {
    products,
    isLoading,
    error,
    reload,
  } = useProducts()

  const isOwner =
    user?.role === 'OWNER'

  function handleNavigate(
    view: AppView,
  ) {
    /*
     * UI guard only.
     *
     * Backend RBAC remains the real
     * authorization boundary.
     */
    const ownerOnlyViews:
      AppView[] = [
        'adjustment',
        'reports',
        'movements',
        'audit',
      ]

    if (
      ownerOnlyViews.includes(
        view,
      ) &&
      !isOwner
    ) {
      return
    }

    setActiveView(view)
  }

  return (
    <AppShell
      activeView={activeView}
      onNavigate={
        handleNavigate
      }
    >
      {activeView ===
        'inventory' && (
        <InventoryPage
          products={products}
          isLoading={
            isLoading
          }
          error={error}
          reload={reload}
        />
      )}

      {activeView ===
        'sale' && (
        <NewSalePage
          products={products}
          isProductsLoading={
            isLoading
          }
          productsError={
            error
          }
          reloadProducts={
            reload
          }
        />
      )}

      {activeView ===
        'receiving' && (
        <ReceiveStockPage
          products={products}
          isProductsLoading={
            isLoading
          }
          productsError={
            error
          }
          reloadProducts={
            reload
          }
        />
      )}

      {activeView ===
        'adjustment' &&
        isOwner && (
          <AdjustStockPage
            products={
              products
            }
            isProductsLoading={
              isLoading
            }
            productsError={
              error
            }
            reloadProducts={
              reload
            }
          />
        )}

      {activeView ===
        'reports' &&
        isOwner && (
          <DailySalesPage />
        )}

      {activeView ===
        'movements' &&
        isOwner && (
          <StockMovementsPage />
        )}

      {activeView ===
        'audit' &&
        isOwner && (
          <AuditHistoryPage />
        )}
    </AppShell>
  )
}

function App() {
  const {
    isAuthenticated,
  } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AuthenticatedApp />
  )
}

export default App