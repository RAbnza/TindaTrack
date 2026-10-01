import {
  apiRequest,
} from './api'

import type {
  CreatedStockAdjustment,
  CreateStockAdjustmentRequest,
} from '../types/stock-adjustment'

export function createStockAdjustment(
  input: CreateStockAdjustmentRequest,
): Promise<CreatedStockAdjustment> {
  return apiRequest<CreatedStockAdjustment>(
    '/api/adjustments',
    {
      method: 'POST',
      body: input,
    },
  )
}