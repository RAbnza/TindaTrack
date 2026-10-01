import {
  useMemo,
  useState,
} from 'react'

import { ProductCard } from '../features/inventory/ProductCard'

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
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">
          Inventory
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Current product stock levels.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 mt-5 space-y-3 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur-sm">
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
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />

        <button
          type="button"
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
            'min-h-11 rounded-xl border px-4 text-sm font-semibold',
            showLowStockOnly
              ? 'border-amber-300 bg-amber-100 text-amber-900'
              : 'border-slate-300 bg-white text-slate-700',
          ].join(' ')}
        >
          {showLowStockOnly
            ? 'Showing low stock'
            : 'Low stock only'}
        </button>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-slate-600">
          Loading inventory...
        </div>
      )}

      {!isLoading && error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p
            role="alert"
            className="text-sm text-red-800"
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void reload()
            }
            className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading &&
        !error &&
        filteredProducts.length ===
          0 && (
          <div className="py-12 text-center">
            <p className="text-base font-medium text-slate-800">
              No products found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search
              or filter.
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredProducts.length >
          0 && (
          <>
            <p className="mt-5 text-sm text-slate-500">
              {
                filteredProducts.length
              }{' '}
              {filteredProducts.length ===
              1
                ? 'product'
                : 'products'}
            </p>

            <div className="mt-3 space-y-3">
              {filteredProducts.map(
                (product) => (
                  <ProductCard
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
    </main>
  )
}