import {
  apiRequest,
} from './api'

import type {
  StockMovement,
} from '../types/stock-movement'

export function getStockMovements(): Promise<
  StockMovement[]
> {
  return apiRequest<StockMovement[]>(
    '/api/stock-movements',
  )
}