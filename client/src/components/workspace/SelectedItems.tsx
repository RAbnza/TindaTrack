import { useState, type ReactNode } from 'react'
import { Pagination } from '../ui/Pagination'
import { EmptyState } from '../ui'

export function SelectedItems<T>({
  items,
  renderItem,
}: {
  items: T[]
  renderItem: (item: T) => ReactNode
}) {
  const [requestedPage, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(requestedPage, totalPages)
  return (
    <section aria-label="Selected transaction items">
      {items.length === 0 ? (
        <EmptyState
          title="No items selected"
          description="Browse products to start this transaction."
        />
      ) : (
        <div className="bounded-list">
          {items.slice((page - 1) * pageSize, page * pageSize).map(renderItem)}
        </div>
      )}
      <Pagination
        label="Selected items"
        meta={{ page, pageSize, total: items.length, totalPages }}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </section>
  )
}
