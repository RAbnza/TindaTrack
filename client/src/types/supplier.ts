/*
 * Operational read model used by
 * Receive Stock.
 */
export type Supplier = {
  id: number
  name: string
}

/*
 * Administrative read model used by
 * Supplier Management.
 */
export type ManagedSupplier = {
  id: number
  name: string
  contactDetails: string | null
  active: boolean
}

export type CreateSupplierRequest = {
  name: string
  contactDetails?: string | null
}

export type UpdateSupplierRequest = {
  name?: string
  contactDetails?: string | null
  active?: boolean
}