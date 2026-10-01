export type PaymentMethod =
  | 'CASH'
  | 'GCASH'
  | 'MAYA'

export type CreateSaleRequest = {
  paymentMethod: PaymentMethod
  items: Array<{
    productId: number
    quantity: number
  }>
}

export type CreatedSale = {
  id: number
  recordedBy: number
  paymentMethod: PaymentMethod
  totalAmount: string
  createdAt: string
}