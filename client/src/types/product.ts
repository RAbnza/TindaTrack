export type Product = {
  id: number
  sku: string
  name: string
  category: string | null
  sellingPrice: string
  reorderLevel: number
  active: boolean
  currentStock: number
  lowStock: boolean
}