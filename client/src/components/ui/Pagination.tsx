import { Button } from './Button'
import type { PaginationMeta } from '../../types/pagination'

export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  label = 'Results',
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  disabled?: boolean
  label?: string
}) {
  const { page, pageSize, total, totalPages } = meta
  const pages = Array.from(
    new Set([1, Math.max(1, page - 1), page, Math.min(totalPages, page + 1), totalPages]),
  ).sort((a, b) => a - b)
  return (
    <nav aria-label={`${label} pagination`} className="pagination-bar">
      <p className="text-caption text-secondary-foreground" aria-live="polite">
        {total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}` : '0'}{' '}
        of {total.toLocaleString()}
      </p>
      {onPageSizeChange && (
        <label className="flex items-center gap-2 text-caption">
          Rows
          <select
            aria-label={`${label} rows per page`}
            className="field-control min-h-11 w-auto px-2"
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          aria-label={`${label} previous page`}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-caption px-2 sm:hidden">
          {page} / {totalPages}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, i) => (
            <span className="inline-flex items-center gap-1" key={p}>
              {i > 0 && p - pages[i - 1] > 1 && <span aria-hidden="true">…</span>}
              <Button
                className="min-w-11 px-2"
                variant={p === page ? 'primary' : 'ghost'}
                aria-label={`${label} page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                disabled={disabled}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            </span>
          ))}
        </div>
        <Button
          variant="secondary"
          aria-label={`${label} next page`}
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
