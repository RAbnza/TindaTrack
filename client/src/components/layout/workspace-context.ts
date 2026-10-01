import { createContext } from 'react'
import type { DashboardLowStockProduct } from '../../types/dashboard'

export type WorkspaceProduct = DashboardLowStockProduct & {
  category?: string | null
  sellingPrice?: string
}

export type WorkspaceContextValue = {
  selectedProduct: WorkspaceProduct | null
  selectProduct: (product: WorkspaceProduct) => void
  clearSelection: () => void
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
