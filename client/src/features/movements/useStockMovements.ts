import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getStockMovements,
} from '../../api/stock-movements.api'

import type {
  StockMovement,
} from '../../types/stock-movement'

function getMovementsErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ApiError
  ) {
    if (
      error.status === 401
    ) {
      return 'Your session has expired. Please sign in again.'
    }

    if (
      error.status === 403
    ) {
      return 'You do not have permission to view stock movement history.'
    }

    return error.message
  }

  return 'Unable to load stock movement history. Please try again.'
}

export function useStockMovements() {
  const [
    movements,
    setMovements,
  ] =
    useState<StockMovement[]>([])

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const reload =
    useCallback(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result =
          await getStockMovements()

        setMovements(result)
      } catch (error) {
        setMovements([])

        setError(
          getMovementsErrorMessage(
            error,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialMovements() {
      try {
        const result =
          await getStockMovements()

        if (cancelled) {
          return
        }

        setMovements(result)
      } catch (error) {
        if (cancelled) {
          return
        }

        setMovements([])

        setError(
          getMovementsErrorMessage(
            error,
          ),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialMovements()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    movements,
    isLoading,
    error,
    reload,
  }
}