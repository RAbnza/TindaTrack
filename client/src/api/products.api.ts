import { apiRequest } from './api'
import type { Product } from '../types/product'

export function getProducts(): Promise<Product[]> {
  return apiRequest<Product[]>('/api/products')
}