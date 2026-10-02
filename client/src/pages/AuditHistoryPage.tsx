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
import { browseAudit } from '../api/workspace.api'
import { usePagedQuery } from '../features/workspace/usePagedQuery'
import { useHistoryQuery } from '../features/workspace/useHistoryQuery'
import { formatAction, formatDateTime } from '../features/workspace/format'
import { AuditMetadataView } from '../features/audit/AuditMetadataView'

const options = [
  { value: 'ALL', label: 'All events' },
  { value: 'SALES', label: 'Sales' },
  { value: 'RECEIPTS', label: 'Receipts' },
  { value: 'ADJUSTMENTS', label: 'Adjustments' },
]
export function AuditHistoryPage() {
  const { query, updateQuery } = useHistoryQuery()
  const { data, isLoading, error, reload } = usePagedQuery(browseAudit, query)
  return (
    <PageContainer>
      <PageHeader
        icon="audit"
        title="Audit History"
        description="Trace business actions to the people and evidence behind them."
      />
      <Card className="mt-5 overflow-hidden">
        <HistoryFilters
          query={query}
          onChange={updateQuery}
          options={options}
          searchLabel="Search actor, action, or entity"
        />
        {isLoading ? (
          <LoadingState label="Loading audit history..." />
        ) : error ? (
          <ErrorState
            title="Unable to load audit history"
            message={error}
            onRetry={reload}
          />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title="No matching audit events"
            description="Try a different search, event type, or date range."
          />
        ) : (
          data && (
            <DataTable
              caption="Audit evidence"
              headings={['Event / time', 'Actor', 'Entity', 'Evidence']}
            >
              {data.items.map((log) => (
                <tr key={log.id}>
                  <td>
                    <Badge
                      variant={
                        log.action === 'SALE_CREATED'
                          ? 'info'
                          : log.action === 'STOCK_RECEIPT_CREATED'
                            ? 'success'
                            : log.action === 'STOCK_ADJUSTMENT_CREATED'
                              ? 'warning'
                              : 'neutral'
                      }
                    >
                      {formatAction(log.action)}
                    </Badge>
                    <p className="mt-2 text-caption text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </td>
                  <td>
                    <p className="font-medium">{log.actor.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {log.actor.role === 'OWNER' ? 'Owner' : 'Staff'}
                    </p>
                  </td>
                  <td>
                    {log.entityType?.replace(/([a-z])([A-Z])/g, '$1 $2') ??
                      'Unknown entity'}
                    {log.entityId !== null ? ` #${log.entityId}` : ''}
                  </td>
                  <td>
                    <details>
                      <summary>View evidence</summary>
                      <div className="rounded-lg bg-surface-tint p-3">
                        <AuditMetadataView log={log} />
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </DataTable>
          )
        )}
        {data && (
          <Pagination
            label="Audit history"
            meta={data.pagination}
            onPageChange={(page) => updateQuery({ page })}
            onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
          />
        )}
      </Card>
    </PageContainer>
  )
}
