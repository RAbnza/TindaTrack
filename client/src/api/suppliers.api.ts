import {
  apiRequest,
} from './api'

import type {
  CreateSupplierRequest,
  ManagedSupplier,
  Supplier,
  UpdateSupplierRequest,
} from '../types/supplier'

/*
 * Operational API.
 *
 * Active suppliers only.
 */
export function getSuppliers(): Promise<
  Supplier[]
> {
  return apiRequest<Supplier[]>(
    '/api/suppliers',
  )
}

/*
 * Administrative API.
 *
 * OWNER only.
 * Includes inactive suppliers.
 */
export function getManagedSuppliers(): Promise<
  ManagedSupplier[]
> {
  return apiRequest<
    ManagedSupplier[]
  >(
    '/api/suppliers/manage',
  )
}

export function createSupplier(
  input: CreateSupplierRequest,
): Promise<ManagedSupplier> {
  return apiRequest<ManagedSupplier>(
    '/api/suppliers',
    {
      method: 'POST',
      body: input,
    },
  )
}

export function updateSupplier(
  supplierId: number,
  input: UpdateSupplierRequest,
): Promise<ManagedSupplier> {
  return apiRequest<ManagedSupplier>(
    `/api/suppliers/${supplierId}`,
    {
      method: 'PATCH',
      body: input,
    },
  )
}