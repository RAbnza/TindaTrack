import { apiRequest } from './api'
import type { Product } from '../types/product'
import type { AuditLog } from '../types/audit-log'
import type { StockMovement } from '../types/stock-movement'
import type { DailySalesReport } from '../types/report'
import type { PagedResult, PaginationMeta } from '../types/pagination'

export type CatalogQuery = {
  page: number
  pageSize: number
  search: string
  category: string
  sort: string
}
export type HistoryQuery = {
  page: number
  pageSize: number
  search: string
  filter: string
  from: string
  to: string
}
function queryString(query: object) {
  return new URLSearchParams(
    Object.entries(query)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString()
}
export const browseProducts = (query: CatalogQuery, signal?: AbortSignal) =>
  apiRequest<PagedResult<Product>>(`/api/products/browse?${queryString(query)}`, {
    signal,
  })
export async function refreshSelection(ids: number[]) {
  const batches = []
  for (let i = 0; i < ids.length; i += 100) batches.push(ids.slice(i, i + 100))
  const products: Product[] = []
  for (const batch of batches)
    products.push(
      ...(await apiRequest<Product[]>(`/api/products/selection?ids=${batch.join(',')}`)),
    )
  return products
}
export const browseAudit = (query: HistoryQuery, signal?: AbortSignal) =>
  apiRequest<PagedResult<AuditLog>>(`/api/audit-logs/browse?${queryString(query)}`, {
    signal,
  })
export const browseMovements = (query: HistoryQuery, signal?: AbortSignal) =>
  apiRequest<PagedResult<StockMovement>>(
    `/api/stock-movements/browse?${queryString(query)}`,
    { signal },
  )
export type PagedDailySales = DailySalesReport & { pagination: PaginationMeta }
export const browseDailySales = (
  query: { date: string; page: number; pageSize: number },
  signal?: AbortSignal,
) =>
  apiRequest<PagedDailySales>(`/api/reports/daily-sales/browse?${queryString(query)}`, {
    signal,
  })
