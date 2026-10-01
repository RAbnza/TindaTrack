import { useState } from 'react'

import { useAuth } from './auth/useAuth'

import {
  AppShell,
  type AppView,
} from './components/AppShell'

import { useProducts } from './features/inventory/useProducts'

import { InventoryPage } from './pages/InventoryPage'
import { LoginPage } from './pages/LoginPage'
import { NewSalePage } from './pages/NewSalePage'

function AuthenticatedApp() {
  const [activeView, setActiveView] =
    useState<AppView>('inventory')

  const {
    products,
    isLoading,
    error,
    reload,
  } = useProducts()

  return (
    <AppShell
      activeView={activeView}
      onNavigate={setActiveView}
    >
      {activeView ===
      'inventory' ? (
        <InventoryPage
          products={products}
          isLoading={isLoading}
          error={error}
          reload={reload}
        />
      ) : (
        <NewSalePage
          products={products}
          isProductsLoading={
            isLoading
          }
          productsError={error}
          reloadProducts={
            reload
          }
        />
      )}
    </AppShell>
  )
}

function App() {
  const { isAuthenticated } =
    useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AuthenticatedApp />
}

export default App