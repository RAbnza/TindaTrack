import { PageContainer } from '../components/layout/PageContainer'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../components/ui'
import { DataTable } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { HistoryFilters } from '../components/workspace/HistoryFilters'
import { browseMovements } from '../api/workspace.api'
import { usePagedQuery } from '../features/workspace/usePagedQuery'
import { useHistoryQuery } from '../features/workspace/useHistoryQuery'
import { formatAction, formatDateTime } from '../features/workspace/format'
import type { StockMovementSource } from '../types/stock-movement'

const options = [
  { value: 'ALL', label: 'All movements' },
  { value: 'RECEIPT', label: 'Receipts' },
  { value: 'SALE', label: 'Sales' },
  { value: 'ADJUSTMENT', label: 'Adjustments' },
]
function sourceLabel(source: StockMovementSource) {
  return source.type === 'SALE'
    ? `Sale item #${source.saleItemId ?? '—'}`
    : source.type === 'RECEIPT'
      ? `Receipt item #${source.stockReceiptItemId ?? '—'}`
      : `Adjustment #${source.stockAdjustmentId ?? '—'}`
}
export function StockMovementsPage() {
  const { query, updateQuery } = useHistoryQuery()
  const { data, isLoading, error, reload } = usePagedQuery(browseMovements, query)
  return (
    <PageContainer>
      <PageHeader
        icon="movements"
        title="Stock Movements"
        description="Review the inventory ledger: receipts, sales, and count corrections."
      />
      <Card className="mt-5 overflow-hidden">
        <HistoryFilters
          query={query}
          onChange={updateQuery}
          options={options}
          searchLabel="Search product or SKU"
        />
        {isLoading ? (
          <LoadingState label="Loading stock movements..." />
        ) : error ? (
          <ErrorState
            title="Unable to load stock movements"
            message={error}
            onRetry={reload}
          />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title="No matching movements"
            description="Try another product, movement type, or date range."
          />
        ) : (
          data && (
            <DataTable
              caption="Inventory ledger"
              headings={[
                'Product',
                'Movement',
                { label: 'Change', numeric: true },
                'Recorded by / time',
                'Source',
              ]}
            >
              {data.items.map((m) => (
                <tr key={m.id}>
                  <td>
                    <p className="font-semibold">{m.product.name}</p>
                    <p className="text-caption text-muted-foreground">{m.product.sku}</p>
                  </td>
                  <td>
                    <Badge variant={m.quantityDelta > 0 ? 'success' : 'danger'}>
                      {formatAction(m.type)}
                    </Badge>
                  </td>
                  <td
                    className={`numeric font-semibold ${m.quantityDelta > 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {m.quantityDelta > 0 ? '+' : ''}
                    {m.quantityDelta}
                  </td>
                  <td>
                    <p>{m.actor.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {m.actor.role === 'OWNER' ? 'Owner' : 'Staff'} ·{' '}
                      {formatDateTime(m.createdAt)}
                    </p>
                  </td>
                  <td>{sourceLabel(m.source)}</td>
                </tr>
              ))}
            </DataTable>
          )
        )}
        {data && (
          <Pagination
            label="Stock movements"
            meta={data.pagination}
            onPageChange={(page) => updateQuery({ page })}
            onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
          />
        )}
      </Card>
    </PageContainer>
  )
}
