import {
  apiRequest,
} from './api'

import type {
  CreateProductRequest,
  Product,
  ProductMasterData,
  UpdateProductRequest,
} from '../types/product'

export function getProducts(): Promise<
  Product[]
> {
  return apiRequest<Product[]>(
    '/api/products',
  )
}

export function createProduct(
  input: CreateProductRequest,
): Promise<ProductMasterData> {
  return apiRequest<ProductMasterData>(
    '/api/products',
    {
      method: 'POST',
      body: input,
    },
  )
}

export function updateProduct(
  productId: number,
  input: UpdateProductRequest,
): Promise<ProductMasterData> {
  return apiRequest<ProductMasterData>(
    `/api/products/${productId}`,
    {
      method: 'PATCH',
      body: input,
    },
  )
}