export type AdjustmentType =
  | 'ADD'
  | 'REMOVE'

export type CreateStockAdjustmentRequest = {
  productId: number
  quantityDelta: number
  reason: string
}

export type CreatedStockAdjustment = {
  id: number
  productId: number
  quantityDelta: number
  reason: string
  adjustedBy: number
  createdAt: string
}