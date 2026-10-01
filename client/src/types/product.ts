export type Product = {
  id: number
  sku: string
  name: string
  category: string | null
  sellingPrice: string
  reorderLevel: number
  active: boolean

  /*
   * Read-only inventory evidence.
   * Derived by the server from
   * StockMovement.
   */
  currentStock: number
  lowStock: boolean
}

export type ProductMasterData = {
  id: number
  sku: string
  name: string
  category: string | null
  sellingPrice: string
  reorderLevel: number
  active: boolean
}

export type CreateProductRequest = {
  sku: string
  name: string
  category?: string | null
  sellingPrice: string
  reorderLevel: number
}

export type UpdateProductRequest = {
  sku?: string
  name?: string
  category?: string | null
  sellingPrice?: string
  reorderLevel?: number
  active?: boolean
}