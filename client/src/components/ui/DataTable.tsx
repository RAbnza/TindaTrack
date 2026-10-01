import type { ReactNode } from 'react'
export function DataTable({
  caption,
  headings,
  children,
}: {
  caption: string
  headings: Array<string | { label: string; numeric: boolean }>
  children: ReactNode
}) {
  return (
    <div className="table-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headings.map((h) => (
              <th
                key={typeof h === 'string' ? h : h.label}
                scope="col"
                className={typeof h !== 'string' && h.numeric ? 'numeric' : ''}
              >
                {typeof h === 'string' ? h : h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
