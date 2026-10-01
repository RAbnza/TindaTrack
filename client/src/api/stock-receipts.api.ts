import {
  apiRequest,
} from './api'

import type {
  CreatedStockReceipt,
  CreateStockReceiptRequest,
} from '../types/stock-receipt'

export function createStockReceipt(
  input: CreateStockReceiptRequest,
): Promise<CreatedStockReceipt> {
  return apiRequest<CreatedStockReceipt>(
    '/api/stock-receipts',
    {
      method: 'POST',
      body: input,
    },
  )
}