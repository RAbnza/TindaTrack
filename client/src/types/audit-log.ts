import type {
  UserRole,
} from './auth'

export type SaleCreatedMetadata = {
  totalAmount: string
  paymentMethod: string
  itemCount: number
}

export type StockReceiptCreatedMetadata = {
  supplierId: number
  referenceNo: string | null
  itemCount: number
}

export type StockAdjustmentCreatedMetadata = {
  productId: number
  quantityDelta: number
  reason: string
  movementType: string
}

export type AuditMetadata =
  | SaleCreatedMetadata
  | StockReceiptCreatedMetadata
  | StockAdjustmentCreatedMetadata
  | Record<string, unknown>
  | null

export type AuditLog = {
  id: number

  actor: {
    id: number
    name: string
    role: UserRole
  }

  action: string
  entityType: string | null
  entityId: number | null
  metadata: AuditMetadata
  createdAt: string
}

export type AuditFilter =
  | 'ALL'
  | 'SALES'
  | 'RECEIPTS'
  | 'ADJUSTMENTS'