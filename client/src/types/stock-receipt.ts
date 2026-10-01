export type CreateStockReceiptRequest = {
  supplierId: number
  referenceNo?: string | null
  items: Array<{
    productId: number
    quantity: number
    unitCost: string
  }>
}

export type CreatedStockReceipt = {
  id: number
  supplierId: number
  receivedBy: number
  referenceNo: string | null
  receivedAt: string
}