import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getProducts,
} from '../../api/products.api'

import type {
  Product,
} from '../../types/product'

function getProductsErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ApiError &&
    error.status === 401
  ) {
    return 'Your session has expired. Please sign in again.'
  }

  if (
    error instanceof ApiError
  ) {
    return error.message
  }

  return 'Unable to load inventory. Please try again.'
}

export function useProducts() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([])

  /*
   * Initial mount immediately begins
   * loading, so true is the correct
   * initial state.
   */
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

  /*
   * Explicit refresh used after sales,
   * receipts, adjustments, and retries.
   *
   * This is not invoked synchronously
   * from the mounting effect.
   */
  const reload =
    useCallback(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result =
          await getProducts()

        setProducts(result)
      } catch (error) {
        setError(
          getProductsErrorMessage(
            error,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialProducts() {
      try {
        const result =
          await getProducts()

        if (cancelled) {
          return
        }

        setProducts(result)
      } catch (error) {
        if (cancelled) {
          return
        }

        setError(
          getProductsErrorMessage(
            error,
          ),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialProducts()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    products,
    isLoading,
    error,
    reload,
  }
}