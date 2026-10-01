export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
export type PagedResult<T> = { items: T[]; pagination: PaginationMeta }
