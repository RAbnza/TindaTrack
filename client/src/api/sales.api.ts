import { apiRequest } from './api'

import type {
  CreatedSale,
  CreateSaleRequest,
} from '../types/sale'

export function createSale(
  input: CreateSaleRequest,
): Promise<CreatedSale> {
  return apiRequest<CreatedSale>(
    '/api/sales',
    {
      method: 'POST',
      body: input,
    },
  )
}