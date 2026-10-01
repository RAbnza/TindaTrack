export type PaymentMethod =
  | 'CASH'
  | 'GCASH'
  | 'MAYA'

export type CreateSaleRequest = {
  paymentMethod:
    PaymentMethod

  items: Array<{
    productId: number
    quantity: number
  }>
}

export type CreatedSaleItem = {
  productId: number
  productName: string
  quantity: number

  /*
   * These are historical,
   * server-authoritative money values.
   */
  unitPrice: string
  lineTotal: string
}

export type CreatedSale = {
  id: number

  recordedBy: number

  recordedByName: string

  paymentMethod:
    PaymentMethod

  /*
   * Calculated by the backend.
   */
  totalAmount: string

  createdAt: string

  items:
    CreatedSaleItem[]
}