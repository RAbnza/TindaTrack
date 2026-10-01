import type {
  UserRole,
} from './auth'

export type StockMovementType =
  | 'RECEIPT'
  | 'SALE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'

export type StockMovementSource =
  | {
      type: 'RECEIPT'
      stockReceiptItemId: number | null
    }
  | {
      type: 'SALE'
      saleItemId: number | null
    }
  | {
      type: 'ADJUSTMENT'
      stockAdjustmentId: number | null
    }

export type StockMovement = {
  id: number

  product: {
    id: number
    sku: string
    name: string
  }

  type: StockMovementType
  quantityDelta: number

  actor: {
    id: number
    name: string
    role: UserRole
  }

  createdAt: string

  source: StockMovementSource
}

export type MovementFilter =
  | 'ALL'
  | 'RECEIPT'
  | 'SALE'
  | 'ADJUSTMENT'