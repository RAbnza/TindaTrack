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

  const loadMovements =
    useCallback(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result =
          await getStockMovements()

        setMovements(result)
      } catch (error) {
        setMovements([])

        if (
          error instanceof ApiError
        ) {
          if (
            error.status === 401
          ) {
            setError(
              'Your session has expired. Please sign in again.',
            )

            return
          }

          if (
            error.status === 403
          ) {
            setError(
              'You do not have permission to view stock movement history.',
            )

            return
          }

          setError(
            error.message,
          )

          return
        }

        setError(
          'Unable to load stock movement history. Please try again.',
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    void loadMovements()
  }, [loadMovements])

  return {
    movements,
    isLoading,
    error,
    reload: loadMovements,
  }
}