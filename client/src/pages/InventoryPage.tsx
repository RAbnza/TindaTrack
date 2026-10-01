import {
  useMemo,
  useState,
} from 'react'

import { ProductCard } from '../features/inventory/ProductCard'
import { useWorkspaceInspector } from '../components/layout/useWorkspaceInspector'
import { PageContainer } from '../components/layout/PageContainer'
import { Button, EmptyState, ErrorState, LoadingState, PageHeader } from '../components/ui'

import type { Product } from '../types/product'

type InventoryPageProps = {
  products: Product[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function InventoryPage({
  products,
  isLoading,
  error,
  reload,
}: InventoryPageProps) {
  const { selectedProduct, selectProduct } = useWorkspaceInspector()
  const [search, setSearch] =
    useState('')

  const [
    showLowStockOnly,
    setShowLowStockOnly,
  ] = useState(false)

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name
          .toLowerCase()
          .includes(
            normalizedSearch,
          ) ||
        product.sku
          .toLowerCase()
          .includes(
            normalizedSearch,
          )

      const matchesStockFilter =
        !showLowStockOnly ||
        product.lowStock

      return (
        matchesSearch &&
        matchesStockFilter
      )
    })
  }, [
    products,
    search,
    showLowStockOnly,
  ])

  return (
    <PageContainer>
      <PageHeader title="Inventory" description="Current product stock levels." />

      <div className="inventory-controls sticky top-0 z-10 mt-5 space-y-3 border-y border-border bg-background/95 py-3 backdrop-blur-sm">
        <label
          htmlFor="product-search"
          className="sr-only"
        >
          Search inventory
        </label>

        <input
          id="product-search"
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Search name or SKU"
          className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
        />

        <Button
          variant="secondary"
          aria-pressed={
            showLowStockOnly
          }
          onClick={() =>
            setShowLowStockOnly(
              (current) =>
                !current,
            )
          }
          className={[
            'min-h-11 rounded-lg border px-4 text-sm font-medium',
            showLowStockOnly
              ? 'border-warning/30 bg-warning-soft text-secondary-foreground'
              : 'border-input bg-card text-secondary-foreground',
          ].join(' ')}
        >
          {showLowStockOnly
            ? 'Showing low stock'
            : 'Low stock only'}
        </Button>
      </div>

      {isLoading && (
        <LoadingState label="Loading inventory..." />
      )}

      {!isLoading && error && (
        <div className="mt-5">
          <ErrorState message={error} onRetry={() => void reload()} />
        </div>
      )}

      {!isLoading &&
        !error &&
        filteredProducts.length ===
          0 && (
          <div className="mt-5">
            <EmptyState title="No products found" description="Try changing your search or filter." />
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredProducts.length >
          0 && (
          <>
            <p className="mt-5 text-sm text-muted-foreground">
              {
                filteredProducts.length
              }{' '}
              {filteredProducts.length ===
              1
                ? 'product'
                : 'products'}
            </p>

            <div className="inventory-product-grid mt-3">
              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    selected={selectedProduct?.id === product.id}
                    onSelect={() => selectProduct(product)}
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                  />
                ),
              )}
            </div>
          </>
        )}
    </PageContainer>
  )
}
