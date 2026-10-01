import { useAuth } from './auth/useAuth'
import { AppShell } from './components/AppShell'
import { InventoryPage } from './pages/InventoryPage'
import { LoginPage } from './pages/LoginPage'

function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AppShell>
      <InventoryPage />
    </AppShell>
  )
}

export default App