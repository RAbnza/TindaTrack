import { Button, EmptyState, ErrorState, LoadingState } from '../ui'
import { Input, Select, FormField } from '../ui/Field'
import { Pagination } from '../ui/Pagination'
import type { useTransactionCatalog } from '../../features/workspace/useTransactionCatalog'

export function ProductBrowser({
  catalog,
  selectedIds,
  onAdd,
  mode,
}: {
  catalog: ReturnType<typeof useTransactionCatalog>
  selectedIds: Set<number>
  onAdd: (id: number) => void
  mode: 'sale' | 'receipt' | 'adjustment'
}) {
  const {
    query,
    updateQuery,
    browserProducts,
    pagination,
    isProductsLoading,
    productsError,
    reloadProducts,
  } = catalog
  return (
    <section aria-label="Product browser">
      <div className="browser-filters p-4">
        <FormField id={`${mode}-search`} label="Search products">
          <Input
            id={`${mode}-search`}
            type="search"
            placeholder="Name or SKU"
            value={query.search}
            onChange={(e) => updateQuery({ search: e.target.value })}
          />
        </FormField>
        <FormField id={`${mode}-category`} label="Category">
          <Input
            id={`${mode}-category`}
            placeholder="All categories"
            value={query.category}
            onChange={(e) => updateQuery({ category: e.target.value })}
          />
        </FormField>
        <FormField id={`${mode}-sort`} label="Sort by">
          <Select
            id={`${mode}-sort`}
            value={query.sort}
            onChange={(e) => updateQuery({ sort: e.target.value })}
          >
            <option value="name">Product name</option>
            <option value="sku">SKU</option>
          </Select>
        </FormField>
      </div>
      {isProductsLoading ? (
        <LoadingState label="Loading products..." />
      ) : productsError ? (
        <ErrorState
          title="Unable to load products"
          message={productsError}
          onRetry={() => void reloadProducts()}
        />
      ) : browserProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try another name, SKU, or category."
        />
      ) : (
        <div className="bounded-list">
          {browserProducts.map((p) => {
            const selected = selectedIds.has(p.id)
            const unavailable = mode === 'sale' && p.currentStock <= 0
            return (
              <article
                key={p.id}
                className={`browser-row ${selected ? 'is-selected' : ''}`}
              >
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">{p.name}</h3>
                  <p className="text-caption text-muted-foreground">
                    {p.sku} · {p.category || 'Uncategorized'}
                  </p>
                </div>
                <div className="text-right text-ui tabular-nums">
                  <p
                    className={
                      p.currentStock <= 0
                        ? 'text-destructive'
                        : p.lowStock
                          ? 'text-warning'
                          : 'text-secondary-foreground'
                    }
                  >
                    {p.currentStock} in stock
                  </p>
                  {mode === 'sale' && (
                    <p className="font-medium">₱{Number(p.sellingPrice).toFixed(2)}</p>
                  )}
                </div>
                <Button
                  variant={selected ? 'secondary' : 'primary'}
                  disabled={selected || unavailable}
                  aria-label={mode === 'adjustment' ? `Select ${p.name}` : undefined}
                  onClick={() => onAdd(p.id)}
                >
                  {selected
                    ? 'Selected'
                    : unavailable
                      ? 'No stock'
                      : mode === 'adjustment'
                        ? 'Select'
                        : 'Add'}
                </Button>
              </article>
            )
          })}
        </div>
      )}
      {pagination && (
        <Pagination
          meta={pagination}
          label="Products"
          disabled={isProductsLoading}
          onPageChange={(page) => updateQuery({ page })}
          onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
        />
      )}
    </section>
  )
}
