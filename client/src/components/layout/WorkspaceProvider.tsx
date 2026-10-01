import { useState, type ReactNode } from 'react'
import { WorkspaceContext, type WorkspaceProduct } from './workspace-context'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedProduct, setSelectedProduct] = useState<WorkspaceProduct | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  function selectProduct(product: WorkspaceProduct) {
    setSelectedProduct(product)
    if (!window.matchMedia('(min-width: 1280px)').matches) {
      setInspectorOpen(true)
    }
  }

  return (
    <WorkspaceContext.Provider value={{
      selectedProduct,
      selectProduct,
      clearSelection: () => setSelectedProduct(null),
      inspectorOpen,
      setInspectorOpen,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}
