import { useCallback, useMemo, useState } from 'react'
import { browseProducts, refreshSelection } from '../../api/workspace.api'
import { ApiError } from '../../api/api'
import type { Product } from '../../types/product'
import { usePagedQuery } from './usePagedQuery'

export type TransactionProductsProps = {
  products?: Product[]
  isProductsLoading?: boolean
  productsError?: string | null
  reloadProducts?: () => Promise<void>
}
const emptyProducts: Product[] = []

export function useTransactionCatalog(
  supplied: TransactionProductsProps,
  selectedIds: number[],
) {
  const [query, setQuery] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    category: '',
    sort: 'name',
  })
  const [cache, setCache] = useState<Product[]>([])
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Injected catalogs are supported for embedding/tests; live routes always use database paging.
  const read = useCallback(
    async (q: typeof query, signal: AbortSignal) => {
      if (!supplied.products) return browseProducts(q, signal)
      const items = supplied.products
        .filter(
          (p) =>
            p.active &&
            (!q.search ||
              `${p.name} ${p.sku}`
                .toLowerCase()
                .includes(q.search.trim().toLowerCase())) &&
            (!q.category ||
              (p.category ?? '').toLowerCase().includes(q.category.toLowerCase())),
        )
        .sort(
          (a, b) =>
            (q.sort === 'sku'
              ? a.sku.localeCompare(b.sku)
              : a.name.localeCompare(b.name)) || a.id - b.id,
        )
      return {
        items: items.slice((q.page - 1) * q.pageSize, q.page * q.pageSize),
        pagination: {
          page: q.page,
          pageSize: q.pageSize,
          total: items.length,
          totalPages: Math.max(1, Math.ceil(items.length / q.pageSize)),
        },
      }
    },
    [supplied.products],
  )
  const result = usePagedQuery(read, query)
  const products = useMemo(
    () =>
      supplied.products ?? [
        ...new Map(
          [...(result.data?.items ?? emptyProducts), ...cache].map((p) => [p.id, p]),
        ).values(),
      ],
    [supplied.products, cache, result.data],
  )
  function retainProduct(id: number) {
    const product = products.find((p) => p.id === id)
    if (product)
      setCache((current) => [
        ...new Map(
          [...current.filter((p) => selectedIds.includes(p.id)), product].map((p) => [
            p.id,
            p,
          ]),
        ).values(),
      ])
  }
  async function reloadProducts() {
    setIsRefreshing(true)
    setRefreshError(null)
    try {
      if (supplied.reloadProducts) await supplied.reloadProducts()
      else {
        const updated = await refreshSelection(selectedIds)
        setCache(updated)
      }
    } catch (error) {
      setRefreshError(
        error instanceof ApiError
          ? error.message
          : 'Unable to refresh selected stock. Retry before continuing.',
      )
    } finally {
      result.reload()
      setIsRefreshing(false)
    }
  }
  return {
    products,
    browserProducts: result.data?.items ?? emptyProducts,
    pagination: result.data?.pagination,
    isProductsLoading:
      Boolean(supplied.isProductsLoading) || result.isLoading || isRefreshing,
    productsError: supplied.productsError ?? refreshError ?? result.error,
    reloadProducts,
    retainProduct,
    query,
    updateQuery: (changes: Partial<typeof query>) =>
      setQuery((q) => ({ ...q, page: 1, ...changes })),
  }
}
