import { useEffect, useState, useCallback } from 'react'
import { ApiError } from '../../api/api'

export function usePagedQuery<T, Q>(
  read: (query: Q, signal: AbortSignal) => Promise<T>,
  query: Q,
) {
  const key = JSON.stringify(query)
  const [state, setState] = useState<{
    key: string
    revision: number
    data: T | null
    error: string | null
    loading: boolean
  }>({ key: '', revision: -1, data: null, error: null, loading: true })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    // Debounce search/filter requests and cancel superseded reads.
    const timer = setTimeout(() => {
      setState({ key, revision, data: null, error: null, loading: true })
      read(JSON.parse(key) as Q, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted)
            setState({ key, revision, data, error: null, loading: false })
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted)
            setState({
              key,
              revision,
              data: null,
              error:
                error instanceof ApiError
                  ? error.message
                  : 'Unable to load records. Please try again.',
              loading: false,
            })
        })
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, revision, read])
  const current = state.key === key && state.revision === revision
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    isLoading: !current || state.loading,
    reload: useCallback(() => setRevision((r) => r + 1), []),
  }
}
