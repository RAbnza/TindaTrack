import {
  apiRequest,
} from './api'

import type {
  Supplier,
} from '../types/supplier'

export function getSuppliers(): Promise<
  Supplier[]
> {
  return apiRequest<Supplier[]>(
    '/api/suppliers',
  )
}