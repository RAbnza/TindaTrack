import { useState } from 'react'
import type { HistoryQuery } from '../../api/workspace.api'
export function useHistoryQuery() {
  const [query, setQuery] = useState<HistoryQuery>({
    page: 1,
    pageSize: 25,
    search: '',
    filter: 'ALL',
    from: '',
    to: '',
  })
  return {
    query,
    updateQuery: (changes: Partial<HistoryQuery>) =>
      setQuery((q) => ({ ...q, page: 1, ...changes })),
  }
}
